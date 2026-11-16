const crypto = require('crypto');
const mongoose = require('mongoose');
const { Order, toPublicOrder } = require('../models/Order');
const { ProductVariant } = require('../models/ProductVariant');
const { ApiError } = require('../utils/ApiError');
const { parsePagination, buildPagination } = require('../utils/pagination');
const { writeAuditLog } = require('./audit.service');
const { AUDIT_ACTIONS } = require('../constants/auditActions');
const {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  FULFILLMENT_STATUSES,
} = require('../constants/orderStatuses');
const { VARIANT_AVAILABILITY } = require('../constants/productStatuses');
const {
  getOrCreateCart,
  resolveSellableLine,
} = require('./cart.service');
const { getEnv } = require('../config/env');
const {
  isRazorpayConfigured,
  createRazorpayOrder,
  verifyPaymentSignature,
  buildCheckoutPayload,
} = require('./razorpay.service');

function makeOrderNumber() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `EMP-${stamp}-${rand}`;
}

async function decrementVariantStock(variantId, quantity, session) {
  const filter = {
    _id: variantId,
    stockQuantity: { $gte: quantity },
    availability: { $ne: VARIANT_AVAILABILITY.DISABLED },
  };
  const update = { $inc: { stockQuantity: -quantity } };
  const opts = { returnDocument: 'after' };
  if (session) opts.session = session;

  const updated = await ProductVariant.findOneAndUpdate(filter, update, opts);
  if (!updated) {
    throw new ApiError(
      409,
      'INSUFFICIENT_STOCK',
      'Insufficient stock during checkout'
    );
  }
  if (updated.availability !== VARIANT_AVAILABILITY.DISABLED) {
    updated.availability =
      updated.stockQuantity > 0
        ? VARIANT_AVAILABILITY.IN_STOCK
        : VARIANT_AVAILABILITY.OUT_OF_STOCK;
    if (session) await updated.save({ session });
    else await updated.save();
  }
  return updated;
}

async function checkout(customerId, shippingAddress) {
  const cart = await getOrCreateCart(customerId);
  if (!cart.items || cart.items.length === 0) {
    throw new ApiError(400, 'EMPTY_CART', 'Cart is empty');
  }

  // Re-validate every line against live catalog/stock and refresh prices.
  const resolvedLines = [];
  for (const item of cart.items) {
    const resolved = await resolveSellableLine({
      productId: String(item.productId),
      variantId: item.variantId ? String(item.variantId) : null,
      quantity: item.quantity,
    });
    resolvedLines.push({
      ...resolved,
      quantity: item.quantity,
      lineTotal: resolved.unitPrice * item.quantity,
    });
  }

  const subtotal = resolvedLines.reduce((s, l) => s + l.lineTotal, 0);
  const shippingFee = 0;
  const total = subtotal + shippingFee;
  const currency = resolvedLines[0]?.currency || 'INR';

  const orderItems = resolvedLines.map((l) => ({
    productId: l.productId,
    variantId: l.variantId,
    vendorId: l.vendorId,
    title: l.title,
    variantLabel: l.variantLabel,
    sku: l.sku || '',
    unitPrice: l.unitPrice,
    quantity: l.quantity,
    lineTotal: l.lineTotal,
    currency: l.currency,
    fulfillmentStatus: FULFILLMENT_STATUSES.UNFULFILLED,
  }));

  const orderDoc = {
    orderNumber: makeOrderNumber(),
    customerId,
    items: orderItems,
    status: ORDER_STATUSES.PENDING_PAYMENT,
    paymentStatus: PAYMENT_STATUSES.UNPAID,
    subtotal,
    shippingFee,
    total,
    currency,
    shippingAddress,
  };

  // Atomic per-variant $inc first, then create order + clear cart.
  // (Full multi-doc transactions need a replica set; Memory Server / standalone
  // Mongo used in local+tests do not.)
  const decremented = [];
  try {
    for (const line of resolvedLines) {
      if (line.tracksStock && line.variantId) {
        await decrementVariantStock(line.variantId, line.quantity, null);
        decremented.push({ variantId: line.variantId, quantity: line.quantity });
      }
    }
  } catch (err) {
    for (const row of decremented) {
      await ProductVariant.findByIdAndUpdate(row.variantId, {
        $inc: { stockQuantity: row.quantity },
      }).catch(() => undefined);
    }
    throw err;
  }

  let order;
  try {
    order = await Order.create(orderDoc);
    cart.items = [];
    await cart.save();
  } catch (err) {
    for (const row of decremented) {
      await ProductVariant.findByIdAndUpdate(row.variantId, {
        $inc: { stockQuantity: row.quantity },
      }).catch(() => undefined);
    }
    throw err;
  }

  await writeAuditLog({
    actorId: customerId,
    targetUserId: customerId,
    action: AUDIT_ACTIONS.ORDER_CREATED,
    meta: {
      entityType: 'Order',
      entityId: String(order._id),
      orderNumber: order.orderNumber,
      total: order.total,
    },
  });

  let razorpay = null;
  if (isRazorpayConfigured()) {
    razorpay = await ensureRazorpayOrder(order);
  }

  return {
    order: toPublicOrder(order),
    razorpay,
  };
}

async function ensureRazorpayOrder(order) {
  if (order.razorpayOrderId) {
    return buildCheckoutPayload(order);
  }
  const created = await createRazorpayOrder({
    receipt: order.orderNumber,
    amountMajor: order.total,
    currency: order.currency,
    notes: {
      orderId: String(order._id),
      orderNumber: order.orderNumber,
    },
  });
  order.razorpayOrderId = created.razorpayOrderId;
  await order.save();
  return buildCheckoutPayload(order);
}

function markOrderPaid(order, { razorpayPaymentId, razorpaySignature, stub }) {
  order.paymentStatus = PAYMENT_STATUSES.PAID;
  order.status = ORDER_STATUSES.PROCESSING;
  order.paidAt = new Date();
  if (razorpayPaymentId) order.razorpayPaymentId = razorpayPaymentId;
  if (razorpaySignature) order.razorpaySignature = razorpaySignature;
  for (const item of order.items) {
    if (item.fulfillmentStatus === FULFILLMENT_STATUSES.UNFULFILLED) {
      item.fulfillmentStatus = FULFILLMENT_STATUSES.PROCESSING;
    }
  }
  return { stub: Boolean(stub) };
}

async function createPaymentSession(customerId, orderId) {
  if (!mongoose.isValidObjectId(orderId)) {
    throw new ApiError(400, 'INVALID_ID', 'Invalid order id');
  }
  const order = await Order.findById(orderId);
  if (!order || String(order.customerId) !== String(customerId)) {
    throw new ApiError(404, 'ORDER_NOT_FOUND', 'Order not found');
  }
  if (order.paymentStatus === PAYMENT_STATUSES.PAID) {
    throw new ApiError(409, 'ALREADY_PAID', 'Order is already paid');
  }
  if (order.status === ORDER_STATUSES.CANCELLED) {
    throw new ApiError(409, 'ORDER_CANCELLED', 'Cannot pay a cancelled order');
  }
  if (!isRazorpayConfigured()) {
    throw new ApiError(
      503,
      'PAYMENTS_UNAVAILABLE',
      'Razorpay is not configured'
    );
  }
  const razorpay = await ensureRazorpayOrder(order);
  return { order: toPublicOrder(order), razorpay };
}

async function verifyRazorpayPayment(customerId, orderId, payload) {
  if (!mongoose.isValidObjectId(orderId)) {
    throw new ApiError(400, 'INVALID_ID', 'Invalid order id');
  }
  const order = await Order.findById(orderId);
  if (!order || String(order.customerId) !== String(customerId)) {
    throw new ApiError(404, 'ORDER_NOT_FOUND', 'Order not found');
  }
  if (order.paymentStatus === PAYMENT_STATUSES.PAID) {
    return toPublicOrder(order);
  }
  if (order.status === ORDER_STATUSES.CANCELLED) {
    throw new ApiError(409, 'ORDER_CANCELLED', 'Cannot pay a cancelled order');
  }
  if (!order.razorpayOrderId) {
    throw new ApiError(
      409,
      'PAYMENT_NOT_STARTED',
      'Create a Razorpay payment session first'
    );
  }
  if (payload.razorpayOrderId !== order.razorpayOrderId) {
    throw new ApiError(
      400,
      'ORDER_MISMATCH',
      'Razorpay order does not match this Emporia order'
    );
  }

  verifyPaymentSignature({
    razorpayOrderId: payload.razorpayOrderId,
    razorpayPaymentId: payload.razorpayPaymentId,
    razorpaySignature: payload.razorpaySignature,
  });

  markOrderPaid(order, {
    razorpayPaymentId: payload.razorpayPaymentId,
    razorpaySignature: payload.razorpaySignature,
  });
  await order.save();

  await writeAuditLog({
    actorId: customerId,
    targetUserId: customerId,
    action: AUDIT_ACTIONS.ORDER_PAID,
    meta: {
      entityType: 'Order',
      entityId: String(order._id),
      orderNumber: order.orderNumber,
      razorpayOrderId: order.razorpayOrderId,
      razorpayPaymentId: order.razorpayPaymentId,
    },
  });

  return toPublicOrder(order);
}

/**
 * Dev/test stub — only when Razorpay is off or RAZORPAY_ALLOW_STUB/test mode.
 */
async function payOrder(customerId, orderId) {
  if (!mongoose.isValidObjectId(orderId)) {
    throw new ApiError(400, 'INVALID_ID', 'Invalid order id');
  }
  const order = await Order.findById(orderId);
  if (!order || String(order.customerId) !== String(customerId)) {
    throw new ApiError(404, 'ORDER_NOT_FOUND', 'Order not found');
  }
  if (order.paymentStatus === PAYMENT_STATUSES.PAID) {
    return toPublicOrder(order);
  }
  if (order.status === ORDER_STATUSES.CANCELLED) {
    throw new ApiError(409, 'ORDER_CANCELLED', 'Cannot pay a cancelled order');
  }

  const env = getEnv();
  if (isRazorpayConfigured() && !env.razorpayAllowStub) {
    throw new ApiError(
      400,
      'USE_RAZORPAY',
      'Use Razorpay Checkout and POST /orders/:id/payments/verify'
    );
  }

  markOrderPaid(order, { stub: true });
  await order.save();

  await writeAuditLog({
    actorId: customerId,
    targetUserId: customerId,
    action: AUDIT_ACTIONS.ORDER_PAID,
    meta: {
      entityType: 'Order',
      entityId: String(order._id),
      orderNumber: order.orderNumber,
      stub: true,
    },
  });

  return toPublicOrder(order);
}

async function listCustomerOrders(customerId, query) {
  const { page, limit, skip } = parsePagination(query);
  const filter = { customerId };
  const [total, rows] = await Promise.all([
    Order.countDocuments(filter),
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
  ]);
  return {
    items: rows.map((r) => toPublicOrder(r)),
    pagination: buildPagination({ page, limit, total }),
  };
}

async function getCustomerOrder(customerId, orderId) {
  if (!mongoose.isValidObjectId(orderId)) {
    throw new ApiError(400, 'INVALID_ID', 'Invalid order id');
  }
  const order = await Order.findById(orderId);
  if (!order || String(order.customerId) !== String(customerId)) {
    throw new ApiError(404, 'ORDER_NOT_FOUND', 'Order not found');
  }
  return toPublicOrder(order);
}

async function listVendorOrders(vendorId, query) {
  const { page, limit, skip } = parsePagination(query);
  const filter = { 'items.vendorId': vendorId };
  if (query.status) filter.status = query.status;
  const [total, rows] = await Promise.all([
    Order.countDocuments(filter),
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
  ]);
  return {
    items: rows.map((r) => toPublicOrder(r, { vendorScope: vendorId })),
    pagination: buildPagination({ page, limit, total }),
  };
}

async function updateVendorFulfillment(
  vendorId,
  orderId,
  itemId,
  fulfillmentStatus
) {
  if (!mongoose.isValidObjectId(orderId) || !mongoose.isValidObjectId(itemId)) {
    throw new ApiError(400, 'INVALID_ID', 'Invalid order or item id');
  }
  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, 'ORDER_NOT_FOUND', 'Order not found');
  }
  const item = order.items.id(itemId);
  if (!item || String(item.vendorId) !== String(vendorId)) {
    throw new ApiError(404, 'ORDER_ITEM_NOT_FOUND', 'Order item not found');
  }
  item.fulfillmentStatus = fulfillmentStatus;

  const statuses = order.items.map((i) => i.fulfillmentStatus);
  if (statuses.every((s) => s === FULFILLMENT_STATUSES.DELIVERED)) {
    order.status = ORDER_STATUSES.COMPLETED;
  } else if (
    statuses.some((s) =>
      [
        FULFILLMENT_STATUSES.PROCESSING,
        FULFILLMENT_STATUSES.SHIPPED,
        FULFILLMENT_STATUSES.DELIVERED,
      ].includes(s)
    ) &&
    order.paymentStatus === PAYMENT_STATUSES.PAID
  ) {
    order.status = ORDER_STATUSES.PROCESSING;
  }

  await order.save();
  await writeAuditLog({
    actorId: vendorId,
    targetUserId: order.customerId,
    action: AUDIT_ACTIONS.ORDER_FULFILLMENT_UPDATED,
    meta: {
      entityType: 'Order',
      entityId: String(order._id),
      itemId: String(itemId),
      fulfillmentStatus,
    },
  });
  return toPublicOrder(order, { vendorScope: vendorId });
}

async function listAdminOrders(query) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
  if (query.q) {
    filter.orderNumber = { $regex: query.q.trim(), $options: 'i' };
  }
  const [total, rows] = await Promise.all([
    Order.countDocuments(filter),
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
  ]);
  return {
    items: rows.map((r) => toPublicOrder(r)),
    pagination: buildPagination({ page, limit, total }),
  };
}

async function getAdminOrder(orderId) {
  if (!mongoose.isValidObjectId(orderId)) {
    throw new ApiError(400, 'INVALID_ID', 'Invalid order id');
  }
  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, 'ORDER_NOT_FOUND', 'Order not found');
  }
  return toPublicOrder(order);
}

module.exports = {
  checkout,
  payOrder,
  createPaymentSession,
  verifyRazorpayPayment,
  listCustomerOrders,
  getCustomerOrder,
  listVendorOrders,
  updateVendorFulfillment,
  listAdminOrders,
  getAdminOrder,
};
