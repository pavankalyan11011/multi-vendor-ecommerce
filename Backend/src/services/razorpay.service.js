const crypto = require('crypto');
const Razorpay = require('razorpay');
const { getEnv } = require('../config/env');
const { ApiError } = require('../utils/ApiError');

let client;

function isRazorpayConfigured() {
  const env = getEnv();
  return Boolean(env.razorpayKeyId && env.razorpayKeySecret);
}

function getClient() {
  if (!isRazorpayConfigured()) {
    throw new ApiError(
      503,
      'PAYMENTS_UNAVAILABLE',
      'Razorpay is not configured'
    );
  }
  if (!client) {
    const env = getEnv();
    client = new Razorpay({
      key_id: env.razorpayKeyId,
      key_secret: env.razorpayKeySecret,
    });
  }
  return client;
}

function resetRazorpayClient() {
  client = undefined;
}

/** Convert major-unit INR amount (e.g. 499.5) to paise for Razorpay. */
function toPaise(amountMajor) {
  return Math.round(Number(amountMajor) * 100);
}

async function createRazorpayOrder({ receipt, amountMajor, currency = 'INR', notes }) {
  const instance = getClient();
  const amount = toPaise(amountMajor);
  if (!Number.isFinite(amount) || amount < 100) {
    throw new ApiError(
      400,
      'INVALID_AMOUNT',
      'Order amount must be at least ₹1.00'
    );
  }

  const order = await instance.orders.create({
    amount,
    currency: (currency || 'INR').toUpperCase(),
    receipt: String(receipt).slice(0, 40),
    notes: notes || undefined,
  });

  return {
    razorpayOrderId: order.id,
    amount: order.amount,
    currency: order.currency,
    status: order.status,
  };
}

function verifyPaymentSignature({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) {
  const env = getEnv();
  if (!env.razorpayKeySecret) {
    throw new ApiError(
      503,
      'PAYMENTS_UNAVAILABLE',
      'Razorpay is not configured'
    );
  }
  const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expected = crypto
    .createHmac('sha256', env.razorpayKeySecret)
    .update(payload)
    .digest('hex');

  const a = Buffer.from(expected);
  const b = Buffer.from(String(razorpaySignature || ''));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new ApiError(400, 'INVALID_SIGNATURE', 'Payment signature mismatch');
  }
  return true;
}

function buildCheckoutPayload(order) {
  const env = getEnv();
  return {
    keyId: env.razorpayKeyId,
    orderId: order.razorpayOrderId,
    amount: toPaise(order.total),
    currency: (order.currency || 'INR').toUpperCase(),
    name: 'Emporia',
    description: `Order ${order.orderNumber}`,
    prefill: {
      name: order.shippingAddress?.fullName || '',
      contact: order.shippingAddress?.phone || '',
    },
    notes: {
      orderId: String(order._id),
      orderNumber: order.orderNumber,
    },
  };
}

module.exports = {
  isRazorpayConfigured,
  createRazorpayOrder,
  verifyPaymentSignature,
  buildCheckoutPayload,
  toPaise,
  resetRazorpayClient,
};
