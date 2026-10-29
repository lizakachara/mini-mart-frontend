const crypto = require("crypto");
const Order = require("../models/Order");

const ONLINE_CHANNELS = ["upi", "card", "netbanking"];

function createPaymentId() {
  return `pay_${crypto.randomBytes(8).toString("hex")}`;
}

function isValidUpiId(value) {
  return /^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/.test(String(value || "").trim());
}

// GET ALL ORDERS (ADMIN)
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    console.error("Get Orders Error:", error.message);

    res.status(500).json({
      message: "Failed to fetch orders.",
    });
  }
};

// GET ORDERS FOR A CUSTOMER
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      userId: req.user.id,
    }).sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    console.error("Get My Orders Error:", error.message);

    res.status(500).json({
      message: "Failed to fetch your orders.",
    });
  }
};

// GET ONE ORDER
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("userId", "name email phone");

    if (!order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    // Customers may only access their own orders.
    if (
      req.user.role !== "admin" &&
      (!order.userId || order.userId._id.toString() !== req.user.id)
    ) {
      return res.status(403).json({
        message: "You are not allowed to view this order.",
      });
    }

    res.status(200).json(order);
  } catch (error) {
    console.error("Get Order Error:", error.message);

    res.status(500).json({
      message: "Failed to fetch order.",
    });
  }
};

// CREATE ORDER
const createOrder = async (req, res) => {
  try {
    const {
      items,
      totalAmount,
      paymentMethod,
      shippingAddress,
      phone,
      payment,
    } = req.body;

    if (
      !Array.isArray(items) ||
      items.length === 0 ||
      totalAmount === undefined ||
      !paymentMethod ||
      !shippingAddress
    ) {
      return res.status(400).json({
        message: "Please provide items, total amount, payment method and shipping address.",
      });
    }

    const amount = Number(totalAmount);

    if (!Number.isFinite(amount) || amount < 0) {
      return res.status(400).json({
        message: "Please provide a valid order total.",
      });
    }

    let paymentStatus = "Pending";
    let orderStatus = "Pending";
    let paymentId = "";
    let paymentChannel = "";
    let savedPaymentMethod = paymentMethod;

    if (paymentMethod === "Online Payment") {
      const channel = String(payment?.channel || "").toLowerCase();

      if (!ONLINE_CHANNELS.includes(channel)) {
        return res.status(400).json({
          message: "Choose UPI, card, or net banking to complete online payment.",
        });
      }

      if (channel === "upi" && !isValidUpiId(payment.upiId)) {
        return res.status(400).json({
          message: "Please enter a valid UPI ID, for example name@oksbi.",
        });
      }

      if (channel === "card") {
        const last4 = String(payment.cardLast4 || "");
        const holder = String(payment.cardHolder || "").trim();

        if (!/^\d{4}$/.test(last4) || holder.length < 2) {
          return res.status(400).json({
            message: "Please complete your card details to pay online.",
          });
        }
      }

      if (channel === "netbanking" && !String(payment.bank || "").trim()) {
        return res.status(400).json({
          message: "Please select a bank to continue with net banking.",
        });
      }

      paymentStatus = "Paid";
      orderStatus = "Confirmed";
      paymentId = createPaymentId();
      paymentChannel = channel;
      savedPaymentMethod = "Online Payment";
    }

    const order = await Order.create({
      userId: req.user.id,
      items,
      totalAmount: amount,
      paymentMethod: savedPaymentMethod,
      paymentStatus,
      orderStatus,
      paymentId,
      paymentChannel,
      shippingAddress,
      phone: phone || "",
    });

    res.status(201).json({
      message: "Order placed successfully.",
      order,
    });
  } catch (error) {
    console.error("Create Order Error:", error.message);

    res.status(500).json({
      message: "Failed to place order.",
    });
  }
};

// UPDATE ORDER STATUS (ADMIN)
const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, paymentStatus } = req.body;
    const updateData = {};

    const allowedOrderStatuses = [
      "Pending",
      "Confirmed",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];

    const allowedPaymentStatuses = [
      "Pending",
      "Paid",
      "Failed",
      "Refunded",
    ];

    if (orderStatus !== undefined) {
      if (!allowedOrderStatuses.includes(orderStatus)) {
        return res.status(400).json({
          message: "Invalid order status.",
        });
      }

      updateData.orderStatus = orderStatus;
    }

    if (paymentStatus !== undefined) {
      if (!allowedPaymentStatuses.includes(paymentStatus)) {
        return res.status(400).json({
          message: "Invalid payment status.",
        });
      }

      updateData.paymentStatus = paymentStatus;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: "Provide an order status or payment status to update.",
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).populate("userId", "name email phone");

    if (!order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    res.status(200).json({
      message: "Order updated successfully.",
      order,
    });
  } catch (error) {
    console.error("Update Order Error:", error.message);

    res.status(500).json({
      message: "Failed to update order.",
    });
  }
};

// DELETE ORDER (ADMIN)
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    res.status(200).json({
      message: "Order deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Order Error:", error.message);

    res.status(error.name === "CastError" ? 400 : 500).json({
      message: error.name === "CastError"
        ? "Invalid order ID."
        : "Failed to delete order.",
    });
  }
};

module.exports = {
  getOrders,
  getMyOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrder,
};