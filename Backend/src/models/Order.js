const mongoose = require('mongoose');
const {
  ORDER_STATUSES,
  ORDER_STATUS_VALUES,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_VALUES,
  FULFILLMENT_STATUSES,
  FULFILLMENT_STATUS_VALUES,
} = require('../constants/orderStatuses');

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    line1: { type: String, required: true, trim: true, maxlength: 200 },
    line2: { type: String, trim: true, maxlength: 200, default: '' },
    city: { type: String, required: true, trim: true, maxlength: 100 },
    state: { type: String, required: true, trim: true, maxlength: 100 },
    postalCode: { type: String, required: true, trim: true, maxlength: 20 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    country: {
      type: String,
      trim: true,
      maxlength: 2,
      default: 'IN',
      uppercase: true,
    },
  },
  { _id: false }
);

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductVariant',
      default: null,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true, maxlength: 200 },
    variantLabel: { type: String, maxlength: 200, default: '' },
    sku: { type: String, maxlength: 64, default: '' },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      maxlength: 3,
      default: 'INR',
    },
    fulfillmentStatus: {
      type: String,
      enum: FULFILLMENT_STATUS_VALUES,
      required: true,
      default: FULFILLMENT_STATUSES.UNFULFILLED,
    },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 32,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator(v) {
          return Array.isArray(v) && v.length >= 1;
        },
        message: 'Order must have at least one item',
      },
    },
    status: {
      type: String,
      enum: ORDER_STATUS_VALUES,
      required: true,
      default: ORDER_STATUSES.PENDING_PAYMENT,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUS_VALUES,
      required: true,
      default: PAYMENT_STATUSES.UNPAID,
    },
    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      maxlength: 3,
      default: 'INR',
    },
    shippingAddress: { type: shippingAddressSchema, required: true },
    paidAt: { type: Date, default: null },
    razorpayOrderId: {
      type: String,
      trim: true,
      maxlength: 64,
      default: null,
    },
    razorpayPaymentId: {
      type: String,
      trim: true,
      maxlength: 64,
      default: null,
    },
    razorpaySignature: {
      type: String,
      trim: true,
      maxlength: 256,
      default: null,
    },
  },
  { timestamps: true }
);

orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ 'items.vendorId': 1, createdAt: -1 });
orderSchema.index(
  { razorpayOrderId: 1 },
  { unique: true, partialFilterExpression: { razorpayOrderId: { $type: 'string' } } }
);

function toPublicOrder(doc, { vendorScope = null } = {}) {
  if (!doc) return null;
  const o = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  let items = (o.items || []).map((item) => ({
    id: String(item._id),
    productId: String(item.productId),
    variantId: item.variantId ? String(item.variantId) : null,
    vendorId: String(item.vendorId),
    title: item.title,
    variantLabel: item.variantLabel || '',
    sku: item.sku || '',
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    lineTotal: item.lineTotal,
    currency: item.currency || 'INR',
    fulfillmentStatus: item.fulfillmentStatus,
  }));

  if (vendorScope) {
    items = items.filter((i) => i.vendorId === String(vendorScope));
  }

  return {
    id: String(o._id),
    orderNumber: o.orderNumber,
    customerId: String(o.customerId),
    items,
    status: o.status,
    paymentStatus: o.paymentStatus,
    subtotal: o.subtotal,
    shippingFee: o.shippingFee,
    total: o.total,
    currency: o.currency || 'INR',
    shippingAddress: o.shippingAddress,
    paidAt: o.paidAt,
    razorpayOrderId: o.razorpayOrderId || null,
    razorpayPaymentId: o.razorpayPaymentId || null,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

module.exports = { Order, toPublicOrder };
