const mongoose = require('mongoose');
const { AUDIT_ACTION_VALUES } = require('../constants/auditActions');

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VendorApplication',
      default: null,
    },
    action: {
      type: String,
      enum: AUDIT_ACTION_VALUES,
      required: true,
      index: true,
    },
    fromAccountStatus: { type: String, default: null },
    toAccountStatus: { type: String, default: null },
    fromApplicationStatus: { type: String, default: null },
    toApplicationStatus: { type: String, default: null },
    reason: { type: String, trim: true, maxlength: 1000, default: null },
    meta: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ createdAt: -1 });

const AuditLog =
  mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);

module.exports = { AuditLog };
