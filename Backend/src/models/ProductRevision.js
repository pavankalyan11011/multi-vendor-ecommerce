/**
 * Phase 3C stub: stores pending merchant edits against an APPROVED product
 * without overwriting the published snapshot.
 */
const mongoose = require('mongoose');

const productRevisionSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
      default: 'PENDING',
    },
    proposed: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: { type: Date, default: null },
    reason: { type: String, maxlength: 1000, default: null },
  },
  { timestamps: true }
);

productRevisionSchema.index({ productId: 1, status: 1 });

const ProductRevision =
  mongoose.models.ProductRevision ||
  mongoose.model('ProductRevision', productRevisionSchema);

module.exports = { ProductRevision };
