const crypto = require("crypto");
const Order = require("../models/Order");
const { closeQrCodeSafely, fetchQrCode } = require("../services/razorpayService");

function expectedAmountPaise(order) {
  return Math.round(Number(order.totalAmount) * 100);
}

async function markOrderPaid(order, paymentId = "") {
  if (order.paymentStatus === "Paid") return;

  order.paymentStatus = "Paid";
  order.orderStatus = "Confirmed";
  order.paymentChannel = "upi";
  if (paymentId) order.paymentId = paymentId;
  await order.save();
}

const getOrderPaymentStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (order.userId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "You are not allowed to view this payment." });
    }

    if (order.paymentMethod !== "Online Payment" || !order.paymentQrId) {
      return res.status(400).json({ message: "This order has no online QR payment." });
    }

    if (order.paymentStatus === "Pending") {
      const qrCode = await fetchQrCode(order.paymentQrId);
      const receivedAmount = Number(qrCode.payments_amount_received || 0);
      const receivedCount = Number(qrCode.payments_count_received || 0);

      if (receivedCount > 0 && receivedAmount === expectedAmountPaise(order)) {
        await markOrderPaid(order);
      } else if (Date.now() >= new Date(order.paymentQrExpiresAt).getTime()) {
        if (qrCode.status === "active") {
          await closeQrCodeSafely(order.paymentQrId);
        }
        order.paymentStatus = "Expired";
        await order.save();
      }
    }

    res.status(200).json({ paymentStatus: order.paymentStatus, order });
  } catch (error) {
    console.error("Get Order Payment Status Error:", error.message);
    res.status(error.statusCode || 500).json({
      message: error.message || "Unable to verify payment status.",
    });
  }
};

const razorpayWebhook = async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.get("x-razorpay-signature");

  if (!webhookSecret || !Buffer.isBuffer(req.rawBody) || !signature) {
    return res.status(400).json({ message: "Payment webhook is not configured." });
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(req.rawBody)
    .digest("hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");
  const signatureBuffer = Buffer.from(signature, "hex");

  if (
    expectedBuffer.length !== signatureBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
  ) {
    return res.status(401).json({ message: "Invalid webhook signature." });
  }

  try {
    const event = JSON.parse(req.rawBody.toString("utf8"));

    if (event.event !== "qr_code.credited") {
      return res.status(200).json({ received: true });
    }

    const payment = event.payload?.payment?.entity;
    const qrCode = event.payload?.qr_code?.entity;

    if (!payment || !qrCode) {
      return res.status(400).json({ message: "Invalid QR payment webhook payload." });
    }

    const order = await Order.findOne({ paymentQrId: qrCode.id });

    if (
      order &&
      payment.status === "captured" &&
      payment.currency === "INR" &&
      Number(payment.amount) === expectedAmountPaise(order) &&
      String(qrCode.notes?.order_id) === String(order._id)
    ) {
      await markOrderPaid(order, payment.id);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Razorpay Webhook Error:", error.message);
    res.status(500).json({ message: "Unable to process payment webhook." });
  }
};

module.exports = {
  getOrderPaymentStatus,
  razorpayWebhook,
};