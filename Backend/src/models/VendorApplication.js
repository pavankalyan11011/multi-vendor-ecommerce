const mongoose = require('mongoose');
const {
  APPLICATION_STATUSES,
  APPLICATION_STATUS_VALUES,
} = require('../constants/applicationStatuses');

const documentSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true, maxlength: 255 },
    storedName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true, min: 1 },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const vendorApplicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    shopName: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 140,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    supportEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 254,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 30,
      default: '',
    },
    applicationStatus: {
      type: String,
      enum: APPLICATION_STATUS_VALUES,
      required: true,
      default: APPLICATION_STATUSES.DRAFT,
      index: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },
    submittedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    documents: { type: [documentSchema], default: [] },
  },
  { timestamps: true }
);

vendorApplicationSchema.index({ applicationStatus: 1, submittedAt: -1 });
vendorApplicationSchema.index(
  { slug: 1 },
  {
    unique: true,
    partialFilterExpression: { slug: { $type: 'string', $gt: '' } },
  }
);

function toPublicApplication(doc) {
  const obj = typeof doc.toJSON === 'function' ? doc.toJSON() : { ...doc };
  return {
    id: obj._id?.toString?.() || obj.id,
    userId: obj.userId?.toString?.() || obj.userId,
    shopName: obj.shopName || '',
    slug: obj.slug || '',
    description: obj.description || '',
    supportEmail: obj.supportEmail || '',
    phone: obj.phone || '',
    applicationStatus: obj.applicationStatus,
    rejectionReason: obj.rejectionReason,
    submittedAt: obj.submittedAt,
    reviewedAt: obj.reviewedAt,
    reviewedBy: obj.reviewedBy?.toString?.() || obj.reviewedBy || null,
    documents: (obj.documents || []).map((d) => ({
      id: d._id?.toString?.() || d.id,
      originalName: d.originalName,
      mimeType: d.mimeType,
      size: d.size,
      uploadedAt: d.uploadedAt,
    })),
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}

const VendorApplication =
  mongoose.models.VendorApplication ||
  mongoose.model('VendorApplication', vendorApplicationSchema);

module.exports = { VendorApplication, toPublicApplication };
