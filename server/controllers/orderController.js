const Order = require("../models/Order");
const Product = require("../models/Product");
const {
  QR_TTL_MS,
  closeQrCodeSafely,
  createQrCode,
  isConfigured,
  scheduleQrCodeClose,
} = require("../services/razorpayService");

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
    const { items, paymentMethod, shippingAddress, phone } = req.body;

    if (
      !Array.isArray(items) ||
      items.length === 0 ||
      !shippingAddress ||
      !["Cash on Delivery", "Online Payment"].includes(paymentMethod)
    ) {
      return res.status(400).json({
        message: "Please provide items, a valid payment method and shipping address.",
      });
    }

    if (paymentMethod === "Online Payment" && !isConfigured()) {
      return res.status(503).json({
        message: "Online payments are not configured on the server.",
      });
    }

    const requestedQuantities = new Map();
    for (const item of items) {
      const productId = String(item.productId || "");
      const quantity = Number(item.quantity);

      if (!/^[a-f\d]{24}$/i.test(productId) || !Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({
          message: "Each cart item must have a valid product and quantity.",
        });
      }

      requestedQuantities.set(
        productId,
        (requestedQuantities.get(productId) || 0) + quantity
      );
    }

    const products = await Product.find({
      _id: { $in: [...requestedQuantities.keys()] },
      isActive: true,
    });
    const productsById = new Map(products.map((product) => [String(product._id), product]));
    const orderItems = [];

    for (const [productId, quantity] of requestedQuantities) {
      const product = productsById.get(productId);

      if (!product) {
        return res.status(400).json({
          message: "A product in your cart is no longer available.",
        });
      }

      if (!Number.isFinite(product.price) || product.price < 0 || quantity > product.stock) {
        return res.status(409).json({
          message: `${product.name} does not have enough stock for this order.`,
        });
      }

      orderItems.push({
        productId: product._id,
        name: product.name,
        image: product.image || "",
        price: product.price,
        quantity,
        unit: product.unit || "piece",
      });
    }

    const amountPaise = orderItems.reduce(
      (total, item) => total + Math.round(item.price * 100) * item.quantity,
      0
    );

    if (!Number.isSafeInteger(amountPaise) || amountPaise < 1) {
      return res.status(400).json({
        message: "The order total must be greater than zero.",
      });
    }

    const order = await Order.create({
      userId: req.user.id,
      items: orderItems,
      totalAmount: amountPaise / 100,
      paymentMethod,
      paymentStatus: "Pending",
      orderStatus: "Pending",
      shippingAddress: String(shippingAddress).trim(),
      phone: phone || "",
    });

    if (paymentMethod === "Online Payment") {
      let qrCode;

      try {
        qrCode = await createQrCode({ orderId: order._id, amountPaise });

        if (!qrCode.id || !qrCode.image_url) {
          throw new Error("The payment provider returned an invalid QR code.");
        }

        order.paymentQrId = qrCode.id;
        order.paymentQrImageUrl = qrCode.image_url;
        order.paymentQrExpiresAt = new Date(Date.now() + QR_TTL_MS);
        await order.save();
        scheduleQrCodeClose(qrCode.id);

        return res.status(201).json({
          message: "Scan the QR code to complete payment.",
          order,
          paymentQr: {
            imageUrl: qrCode.image_url,
            expiresAt: order.paymentQrExpiresAt,
          },
        });
      } catch (error) {
        if (qrCode?.id) await closeQrCodeSafely(qrCode.id);
        await Order.findByIdAndDelete(order._id);
        throw error;
      }
    }

    res.status(201).json({
      message: "Order placed successfully.",
      order,
    });
  } catch (error) {
    console.error("Create Order Error:", error.message);

    res.status(error.statusCode || 500).json({
      message: error.message || "Failed to place order.",
    });
  }
};

// UPDATE ORDER STATUS (ADMIN)
const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;

    if (req.body.paymentStatus !== undefined) {
      return res.status(400).json({
        message: "Payment status is managed by the payment provider.",
      });
    }

    const allowedOrderStatuses = [
      "Pending",
      "Confirmed",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];

    if (!allowedOrderStatuses.includes(orderStatus)) {
      return res.status(400).json({
        message: "Invalid order status.",
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus },
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