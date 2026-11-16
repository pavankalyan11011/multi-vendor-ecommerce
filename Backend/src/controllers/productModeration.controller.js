const productModerationService = require('../services/productModeration.service');
const { asyncHandler } = require('../utils/asyncHandler');

const listAdmin = asyncHandler(async (req, res) => {
  const data = await productModerationService.listAdminProducts(req.query);
  res.json({ success: true, data });
});

const getAdmin = asyncHandler(async (req, res) => {
  const data = await productModerationService.getAdminProduct(req.params.id);
  res.json({ success: true, data });
});

const approve = asyncHandler(async (req, res) => {
  const data = await productModerationService.approveProduct(
    req.params.id,
    req.auth.userId
  );
  res.json({ success: true, data });
});

const reject = asyncHandler(async (req, res) => {
  const data = await productModerationService.rejectProduct(
    req.params.id,
    req.auth.userId,
    req.body.reason
  );
  res.json({ success: true, data });
});

const listRevisions = asyncHandler(async (req, res) => {
  const data = await productModerationService.listProductRevisions(req.query);
  res.json({ success: true, data });
});

const approveRevision = asyncHandler(async (req, res) => {
  const data = await productModerationService.approveRevision(
    req.params.id,
    req.auth.userId
  );
  res.json({ success: true, data });
});

const rejectRevision = asyncHandler(async (req, res) => {
  const data = await productModerationService.rejectRevision(
    req.params.id,
    req.auth.userId,
    req.body.reason
  );
  res.json({ success: true, data });
});

const listPublic = asyncHandler(async (req, res) => {
  const data = await productModerationService.listPublicProducts(req.query);
  res.json({ success: true, data });
});

const getPublic = asyncHandler(async (req, res) => {
  const data = await productModerationService.getPublicProduct(req.params.id);
  res.json({ success: true, data });
});

module.exports = {
  listAdmin,
  getAdmin,
  approve,
  reject,
  listRevisions,
  approveRevision,
  rejectRevision,
  listPublic,
  getPublic,
};
