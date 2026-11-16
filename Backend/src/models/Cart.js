const mongoose = require('mongoose');

/**
 * Money fields use the same unit as Product.basePrice / Variant.price
 * (INR major units, e.g. 499 = ₹499), not paise.
 */
const cartItemSchema = new mongoose.Schema(
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
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    variantLabel: { type: String, trim: true, maxlength: 200, default: '' },
    quantity: { type: Number, required: true, min: 1, max: 99 },
    unitPrice: { type: Number, required: true, min: 0 },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      maxlength: 3,
      default: 'INR',
    },
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
      validate: {
        validator(v) {
          return Array.isArray(v) && v.length <= 50;
        },
        message: 'Too many cart lines',
      },
    },
  },
  { timestamps: true }
);

function lineTotal(item) {
  return Number(item.unitPrice) * Number(item.quantity);
}

function toPublicCart(doc) {
  if (!doc) return null;
  const o = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const items = (o.items || []).map((item) => ({
    id: String(item._id),
    productId: String(item.productId),
    variantId: item.variantId ? String(item.variantId) : null,
    vendorId: String(item.vendorId),
    title: item.title,
    variantLabel: item.variantLabel || '',
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: lineTotal(item),
    currency: item.currency || 'INR',
  }));
  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  return {
    id: String(o._id),
    customerId: String(o.customerId),
    items,
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    subtotal,
    currency: items[0]?.currency || 'INR',
    updatedAt: o.updatedAt,
  };
}

const Cart = mongoose.models.Cart || mongoose.model('Cart', cartSchema);

module.exports = { Cart, toPublicCart, lineTotal };
