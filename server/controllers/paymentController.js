const crypto = require("crypto");
const Order = require("../models/Order");

function canAccessOrder(order, user) {
  return order.userId.toString() === user.id || user.role === "admin";
}

const getOrderPaymentStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (!canAccessOrder(order, req.user)) {
      return res.status(403).json({ message: "You are not allowed to view this payment." });
    }

    if (!["Demo Online Payment", "Demo Card Payment"].includes(order.paymentMethod)) {
      return res.status(400).json({ message: "This order has no online payment." });
    }

    if (
      order.paymentMethod === "Demo Online Payment" &&
      order.paymentStatus === "Pending" &&
      Date.now() >= new Date(order.paymentQrExpiresAt).getTime()
    ) {
      order.paymentStatus = "Expired";
      await order.save();
    }

    res.status(200).json({ paymentStatus: order.paymentStatus, order });
  } catch (error) {
    console.error("Get Payment Status Error:", error.message);
    res.status(500).json({ message: "Unable to verify payment status." });
  }
};

const completeDemoPayment = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (!canAccessOrder(order, req.user)) {
      return res.status(403).json({ message: "You are not allowed to complete this payment." });
    }

    if (!["Demo Online Payment", "Demo Card Payment"].includes(order.paymentMethod)) {
      return res.status(400).json({ message: "This order is not using online payment." });
    }

    if (order.paymentStatus !== "Pending") {
      return res.status(409).json({ message: `This payment is already ${order.paymentStatus.toLowerCase()}.` });
    }

    if (
      order.paymentMethod === "Demo Online Payment" &&
      (!order.paymentQrExpiresAt || Date.now() >= order.paymentQrExpiresAt.getTime())
    ) {
      order.paymentStatus = "Expired";
      await order.save();
      return res.status(410).json({ message: "This QR has expired. Generate a new one." });
    }

    order.paymentStatus = "Paid";
    order.paymentChannel =
      order.paymentMethod === "Demo Card Payment" ? "card" : "demo";
    order.paymentId = `DEMO-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
    order.orderStatus = "Confirmed";
    await order.save();

    res.status(200).json({
      message: " payment completed.",
      order,
    });
  } catch (error) {
    console.error("Complete Payment Error:", error.message);
    res.status(500).json({ message: "Unable to complete payment." });
  }
};

module.exports = {
  completeDemoPayment,
  getOrderPaymentStatus,
};
