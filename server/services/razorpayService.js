const QR_TTL_MS = 60 * 1000;
const qrCloseTimers = new Map();

function isConfigured() {
  return Boolean(
    process.env.RAZORPAY_KEY_ID &&
    process.env.RAZORPAY_KEY_SECRET
  );
}

async function razorpayRequest(path, { method = "GET", body } = {}) {
  if (!isConfigured()) {
    const error = new Error("Online payments are not configured on the server.");
    error.statusCode = 503;
    throw error;
  }

  const credentials = Buffer.from(
    `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
  ).toString("base64");
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      data.error?.description || "The payment provider could not process this request."
    );
    error.statusCode = response.status;
    throw error;
  }

  return data;
}

function createQrCode({ orderId, amountPaise }) {
  return razorpayRequest("/payments/qr_codes", {
    method: "POST",
    body: {
      type: "upi_qr",
      name: `Mini Mart ${String(orderId).slice(-12)}`,
      usage: "single_use",
      fixed_amount: true,
      payment_amount: amountPaise,
      description: `Mini Mart order ${orderId}`,
      close_by: Math.floor(Date.now() / 1000) + 180,
      notes: { order_id: String(orderId) },
    },
  });
}

function fetchQrCode(qrCodeId) {
  return razorpayRequest(`/payments/qr_codes/${encodeURIComponent(qrCodeId)}`);
}

function closeQrCode(qrCodeId) {
  return razorpayRequest(
    `/payments/qr_codes/${encodeURIComponent(qrCodeId)}/close`,
    { method: "POST" }
  );
}

function closeQrCodeSafely(qrCodeId) {
  const timer = qrCloseTimers.get(qrCodeId);
  if (timer) {
    clearTimeout(timer);
    qrCloseTimers.delete(qrCodeId);
  }

  return closeQrCode(qrCodeId).catch((error) => {
    console.error("Close Razorpay QR Error:", error.message);
  });
}

function scheduleQrCodeClose(qrCodeId) {
  const timer = setTimeout(() => {
    qrCloseTimers.delete(qrCodeId);
    closeQrCode(qrCodeId).catch((error) => {
      console.error("Expire Razorpay QR Error:", error.message);
    });
  }, QR_TTL_MS);

  timer.unref?.();
  qrCloseTimers.set(qrCodeId, timer);
}

module.exports = {
  QR_TTL_MS,
  closeQrCodeSafely,
  createQrCode,
  fetchQrCode,
  isConfigured,
  scheduleQrCodeClose,
};