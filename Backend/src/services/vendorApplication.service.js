const path = require('path');
const fs = require('fs/promises');
const { User } = require('../models/User');
const {
  VendorApplication,
  toPublicApplication,
} = require('../models/VendorApplication');
const { ROLES } = require('../constants/roles');
const { STATUSES } = require('../constants/statuses');
const { APPLICATION_STATUSES } = require('../constants/applicationStatuses');
const { AUDIT_ACTIONS } = require('../constants/auditActions');
const { ApiError } = require('../utils/ApiError');
const { ensureUniqueSlug } = require('../utils/slugify');
const { parsePagination, buildPagination } = require('../utils/pagination');
const { writeAuditLog } = require('./audit.service');

async function ensureVendorApplication(userId) {
  let app = await VendorApplication.findOne({ userId });
  if (!app) {
    app = await VendorApplication.create({
      userId,
      applicationStatus: APPLICATION_STATUSES.DRAFT,
    });
  }
  return app;
}

async function getOwnApplication(userId) {
  const app = await ensureVendorApplication(userId);
  return toPublicApplication(app);
}

function assertEditable(app) {
  if (
    app.applicationStatus !== APPLICATION_STATUSES.DRAFT &&
    app.applicationStatus !== APPLICATION_STATUSES.REJECTED
  ) {
    throw new ApiError(
      409,
      'APPLICATION_NOT_EDITABLE',
      'Only DRAFT or REJECTED applications can be edited'
    );
  }
}

async function updateOwnApplication(userId, payload) {
  const app = await ensureVendorApplication(userId);
  assertEditable(app);

  const slug = await ensureUniqueSlug(payload.shopName, async (candidate) => {
    const existing = await VendorApplication.findOne({
      slug: candidate,
      userId: { $ne: userId },
    }).lean();
    return Boolean(existing);
  });

  app.shopName = payload.shopName;
  app.slug = slug;
  app.description = payload.description;
  app.supportEmail = payload.supportEmail;
  app.phone = payload.phone;
  if (app.applicationStatus === APPLICATION_STATUSES.REJECTED) {
    // Editing a rejected application returns it to draft until resubmit.
    app.applicationStatus = APPLICATION_STATUSES.DRAFT;
    app.rejectionReason = null;
    app.reviewedAt = null;
    app.reviewedBy = null;
  }
  await app.save();
  return toPublicApplication(app);
}

function assertReadyToSubmit(app) {
  if (!app.shopName || app.shopName.length < 2) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'shopName is required before submit');
  }
  if (!app.description || app.description.length < 20) {
    throw new ApiError(
      400,
      'VALIDATION_ERROR',
      'description must be at least 20 characters before submit'
    );
  }
  if (!app.supportEmail) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'supportEmail is required before submit');
  }
  if (!app.phone) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'phone is required before submit');
  }
}

async function submitOwnApplication(userId, actorId) {
  const app = await ensureVendorApplication(userId);
  if (
    app.applicationStatus !== APPLICATION_STATUSES.DRAFT &&
    app.applicationStatus !== APPLICATION_STATUSES.REJECTED
  ) {
    throw new ApiError(
      409,
      'APPLICATION_ALREADY_SUBMITTED',
      'Application is already submitted or approved'
    );
  }

  assertReadyToSubmit(app);
  const from = app.applicationStatus;
  const action =
    from === APPLICATION_STATUSES.REJECTED
      ? AUDIT_ACTIONS.APPLICATION_RESUBMITTED
      : AUDIT_ACTIONS.APPLICATION_SUBMITTED;

  app.applicationStatus = APPLICATION_STATUSES.SUBMITTED;
  app.submittedAt = new Date();
  app.rejectionReason = null;
  app.reviewedAt = null;
  app.reviewedBy = null;
  await app.save();

  await writeAuditLog({
    actorId,
    targetUserId: userId,
    applicationId: app._id,
    action,
    fromApplicationStatus: from,
    toApplicationStatus: APPLICATION_STATUSES.SUBMITTED,
  });

  return toPublicApplication(app);
}

async function addDocument(userId, file) {
  const app = await ensureVendorApplication(userId);
  assertEditable(app);

  if ((app.documents || []).length >= 5) {
    throw new ApiError(400, 'DOCUMENT_LIMIT', 'Maximum of 5 documents allowed');
  }

  app.documents.push({
    originalName: file.originalname,
    storedName: file.filename,
    mimeType: file.mimetype,
    size: file.size,
    uploadedAt: new Date(),
  });
  await app.save();
  return toPublicApplication(app);
}

async function getDocumentForDownload(userId, documentId, { asAdmin = false } = {}) {
  const app = asAdmin
    ? await VendorApplication.findOne({ 'documents._id': documentId })
    : await VendorApplication.findOne({ userId });
  if (!app) {
    throw new ApiError(404, 'NOT_FOUND', 'Application not found');
  }
  const doc = app.documents.id(documentId);
  if (!doc) {
    throw new ApiError(404, 'NOT_FOUND', 'Document not found');
  }
  if (!asAdmin && app.userId.toString() !== userId) {
    throw new ApiError(403, 'FORBIDDEN', 'Not allowed to access this document');
  }
  return { app, doc };
}

function uploadsDir() {
  return path.join(process.cwd(), 'uploads', 'vendor-docs');
}

async function resolveDocumentPath(storedName) {
  const full = path.join(uploadsDir(), storedName);
  const normalizedRoot = path.resolve(uploadsDir());
  const normalizedFile = path.resolve(full);
  if (!normalizedFile.startsWith(normalizedRoot + path.sep)) {
    throw new ApiError(400, 'INVALID_PATH', 'Invalid document path');
  }
  await fs.access(normalizedFile);
  return normalizedFile;
}

async function listApplications(query) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};
  if (query.status) {
    filter.applicationStatus = query.status;
  }
  if (query.q) {
    const q = query.q.trim();
    filter.$or = [
      { shopName: { $regex: q, $options: 'i' } },
      { slug: { $regex: q, $options: 'i' } },
      { supportEmail: { $regex: q, $options: 'i' } },
    ];
  }

  const [rows, total] = await Promise.all([
    VendorApplication.find(filter)
      .sort({ submittedAt: -1, updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'fullName email role status')
      .lean(),
    VendorApplication.countDocuments(filter),
  ]);

  const items = rows.map((row) => {
    const pub = toPublicApplication(row);
    const user = row.userId;
    return {
      ...pub,
      user: user
        ? {
            id: user._id.toString(),
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            status: user.status,
          }
        : null,
    };
  });

  return {
    items,
    pagination: buildPagination({ page, limit, total }),
  };
}

async function getApplicationById(applicationId) {
  const app = await VendorApplication.findById(applicationId).populate(
    'userId',
    'fullName email role status'
  );
  if (!app) {
    throw new ApiError(404, 'NOT_FOUND', 'Application not found');
  }
  const pub = toPublicApplication(app);
  const user = app.userId;
  return {
    ...pub,
    user: user
      ? {
          id: user._id.toString(),
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          status: user.status,
        }
      : null,
  };
}

async function approveApplication(applicationId, adminUserId) {
  const app = await VendorApplication.findById(applicationId);
  if (!app) {
    throw new ApiError(404, 'NOT_FOUND', 'Application not found');
  }
  if (app.applicationStatus !== APPLICATION_STATUSES.SUBMITTED) {
    throw new ApiError(
      409,
      'INVALID_APPLICATION_STATE',
      'Only SUBMITTED applications can be approved'
    );
  }

  const user = await User.findById(app.userId);
  if (!user || user.role !== ROLES.VENDOR) {
    throw new ApiError(404, 'NOT_FOUND', 'Vendor account not found');
  }
  if (user._id.toString() === adminUserId) {
    throw new ApiError(403, 'FORBIDDEN', 'Admins cannot approve their own vendor application');
  }

  const fromApp = app.applicationStatus;
  const fromAccount = user.status;

  app.applicationStatus = APPLICATION_STATUSES.APPROVED;
  app.rejectionReason = null;
  app.reviewedAt = new Date();
  app.reviewedBy = adminUserId;
  await app.save();

  user.status = STATUSES.ACTIVE;
  await user.save();

  await writeAuditLog({
    actorId: adminUserId,
    targetUserId: user._id,
    applicationId: app._id,
    action: AUDIT_ACTIONS.APPLICATION_APPROVED,
    fromAccountStatus: fromAccount,
    toAccountStatus: STATUSES.ACTIVE,
    fromApplicationStatus: fromApp,
    toApplicationStatus: APPLICATION_STATUSES.APPROVED,
  });

  return getApplicationById(applicationId);
}

async function rejectApplication(applicationId, adminUserId, reason) {
  const app = await VendorApplication.findById(applicationId);
  if (!app) {
    throw new ApiError(404, 'NOT_FOUND', 'Application not found');
  }
  if (app.applicationStatus !== APPLICATION_STATUSES.SUBMITTED) {
    throw new ApiError(
      409,
      'INVALID_APPLICATION_STATE',
      'Only SUBMITTED applications can be rejected'
    );
  }

  const user = await User.findById(app.userId);
  if (!user || user.role !== ROLES.VENDOR) {
    throw new ApiError(404, 'NOT_FOUND', 'Vendor account not found');
  }
  if (user._id.toString() === adminUserId) {
    throw new ApiError(403, 'FORBIDDEN', 'Admins cannot reject their own vendor application');
  }

  const fromApp = app.applicationStatus;
  app.applicationStatus = APPLICATION_STATUSES.REJECTED;
  app.rejectionReason = reason;
  app.reviewedAt = new Date();
  app.reviewedBy = adminUserId;
  await app.save();

  // Account stays PENDING so the vendor can still sign in and resubmit.
  if (user.status === STATUSES.ACTIVE) {
    user.status = STATUSES.PENDING;
    await user.save();
  }

  await writeAuditLog({
    actorId: adminUserId,
    targetUserId: user._id,
    applicationId: app._id,
    action: AUDIT_ACTIONS.APPLICATION_REJECTED,
    fromAccountStatus: user.status,
    toAccountStatus: user.status,
    fromApplicationStatus: fromApp,
    toApplicationStatus: APPLICATION_STATUSES.REJECTED,
    reason,
  });

  return getApplicationById(applicationId);
}

async function suspendVendorAccount(targetUserId, adminUserId, reason) {
  if (targetUserId === adminUserId) {
    throw new ApiError(403, 'FORBIDDEN', 'Cannot suspend your own account via this endpoint');
  }
  const user = await User.findById(targetUserId);
  if (!user || user.role !== ROLES.VENDOR) {
    throw new ApiError(404, 'NOT_FOUND', 'Vendor account not found');
  }
  if (user.status === STATUSES.SUSPENDED) {
    throw new ApiError(409, 'ALREADY_SUSPENDED', 'Vendor account is already suspended');
  }

  const fromAccount = user.status;
  user.status = STATUSES.SUSPENDED;
  await user.save();

  const app = await VendorApplication.findOne({ userId: user._id });
  await writeAuditLog({
    actorId: adminUserId,
    targetUserId: user._id,
    applicationId: app?._id || null,
    action: AUDIT_ACTIONS.ACCOUNT_SUSPENDED,
    fromAccountStatus: fromAccount,
    toAccountStatus: STATUSES.SUSPENDED,
    fromApplicationStatus: app?.applicationStatus || null,
    toApplicationStatus: app?.applicationStatus || null,
    reason,
  });

  return {
    userId: user._id.toString(),
    accountStatus: user.status,
    applicationStatus: app?.applicationStatus || null,
  };
}

async function reactivateVendorAccount(targetUserId, adminUserId) {
  if (targetUserId === adminUserId) {
    throw new ApiError(403, 'FORBIDDEN', 'Cannot reactivate your own account via this endpoint');
  }
  const user = await User.findById(targetUserId);
  if (!user || user.role !== ROLES.VENDOR) {
    throw new ApiError(404, 'NOT_FOUND', 'Vendor account not found');
  }
  if (user.status !== STATUSES.SUSPENDED) {
    throw new ApiError(409, 'NOT_SUSPENDED', 'Vendor account is not suspended');
  }

  const app = await VendorApplication.findOne({ userId: user._id });
  if (!app || app.applicationStatus !== APPLICATION_STATUSES.APPROVED) {
    throw new ApiError(
      409,
      'NOT_APPROVED',
      'Only vendors with an APPROVED application can be reactivated to ACTIVE'
    );
  }

  const fromAccount = user.status;
  user.status = STATUSES.ACTIVE;
  await user.save();

  await writeAuditLog({
    actorId: adminUserId,
    targetUserId: user._id,
    applicationId: app._id,
    action: AUDIT_ACTIONS.ACCOUNT_REACTIVATED,
    fromAccountStatus: fromAccount,
    toAccountStatus: STATUSES.ACTIVE,
    fromApplicationStatus: app.applicationStatus,
    toApplicationStatus: app.applicationStatus,
  });

  return {
    userId: user._id.toString(),
    accountStatus: user.status,
    applicationStatus: app.applicationStatus,
  };
}

module.exports = {
  ensureVendorApplication,
  getOwnApplication,
  updateOwnApplication,
  submitOwnApplication,
  addDocument,
  getDocumentForDownload,
  resolveDocumentPath,
  uploadsDir,
  listApplications,
  getApplicationById,
  approveApplication,
  rejectApplication,
  suspendVendorAccount,
  reactivateVendorAccount,
};
