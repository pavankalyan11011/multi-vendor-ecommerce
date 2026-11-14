const vendorApplicationService = require('../services/vendorApplication.service');
const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/ApiError');
const { openStoredFile } = require('../storage');
const { STORAGE_FOLDERS } = require('../constants/storageFolders');
const { streamDownload } = require('../utils/streamDownload');

const getMine = asyncHandler(async (req, res) => {
  const data = await vendorApplicationService.getOwnApplication(req.auth.userId);
  res.json({ success: true, data });
});

const updateMine = asyncHandler(async (req, res) => {
  const data = await vendorApplicationService.updateOwnApplication(
    req.auth.userId,
    req.body
  );
  res.json({ success: true, data });
});

const submitMine = asyncHandler(async (req, res) => {
  const data = await vendorApplicationService.submitOwnApplication(
    req.auth.userId,
    req.auth.userId
  );
  res.json({ success: true, data });
});

const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'document file is required');
  }
  const data = await vendorApplicationService.addDocument(req.auth.userId, req.file);
  res.status(201).json({ success: true, data });
});

const downloadOwnDocument = asyncHandler(async (req, res) => {
  const { doc } = await vendorApplicationService.getDocumentForDownload(
    req.auth.userId,
    req.params.documentId,
    { asAdmin: false }
  );
  const file = await openStoredFile(STORAGE_FOLDERS.VENDOR_DOCS, doc.storedName);
  streamDownload(res, {
    stream: file.stream,
    filename: doc.originalName,
    contentType: file.contentType || doc.mimeType,
    contentLength: file.contentLength,
  });
});

const listApplications = asyncHandler(async (req, res) => {
  const data = await vendorApplicationService.listApplications(req.query);
  res.json({ success: true, data });
});

const getApplication = asyncHandler(async (req, res) => {
  const data = await vendorApplicationService.getApplicationById(req.params.id);
  res.json({ success: true, data });
});

const approveApplication = asyncHandler(async (req, res) => {
  const data = await vendorApplicationService.approveApplication(
    req.params.id,
    req.auth.userId
  );
  res.json({ success: true, data });
});

const rejectApplication = asyncHandler(async (req, res) => {
  const data = await vendorApplicationService.rejectApplication(
    req.params.id,
    req.auth.userId,
    req.body.reason
  );
  res.json({ success: true, data });
});

const suspendAccount = asyncHandler(async (req, res) => {
  const data = await vendorApplicationService.suspendVendorAccount(
    req.params.userId,
    req.auth.userId,
    req.body.reason
  );
  res.json({ success: true, data });
});

const reactivateAccount = asyncHandler(async (req, res) => {
  const data = await vendorApplicationService.reactivateVendorAccount(
    req.params.userId,
    req.auth.userId
  );
  res.json({ success: true, data });
});

const downloadAdminDocument = asyncHandler(async (req, res) => {
  const { doc } = await vendorApplicationService.getDocumentForDownload(
    req.auth.userId,
    req.params.documentId,
    { asAdmin: true }
  );
  const file = await openStoredFile(STORAGE_FOLDERS.VENDOR_DOCS, doc.storedName);
  streamDownload(res, {
    stream: file.stream,
    filename: doc.originalName,
    contentType: file.contentType || doc.mimeType,
    contentLength: file.contentLength,
  });
});

module.exports = {
  getMine,
  updateMine,
  submitMine,
  uploadDocument,
  downloadOwnDocument,
  listApplications,
  getApplication,
  approveApplication,
  rejectApplication,
  suspendAccount,
  reactivateAccount,
  downloadAdminDocument,
};
