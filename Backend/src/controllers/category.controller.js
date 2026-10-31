const categoryService = require('../services/category.service');
const categoryAttributeService = require('../services/categoryAttribute.service');
const { asyncHandler } = require('../utils/asyncHandler');

const create = asyncHandler(async (req, res) => {
  const data = await categoryService.createCategory(req.body, req.auth.userId);
  res.status(201).json({ success: true, data });
});

const update = asyncHandler(async (req, res) => {
  const data = await categoryService.updateCategory(
    req.params.id,
    req.body,
    req.auth.userId
  );
  res.json({ success: true, data });
});

const setStatus = asyncHandler(async (req, res) => {
  const data = await categoryService.setCategoryStatus(
    req.params.id,
    req.body.status,
    req.auth.userId
  );
  res.json({ success: true, data });
});

const move = asyncHandler(async (req, res) => {
  const data = await categoryService.moveCategory(
    req.params.id,
    req.body.parentId,
    req.auth.userId
  );
  res.json({ success: true, data });
});

const reorder = asyncHandler(async (req, res) => {
  const data = await categoryService.reorderCategories(
    req.body.parentId ?? null,
    req.body.orderedIds,
    req.auth.userId
  );
  res.json({ success: true, data });
});

const listAdmin = asyncHandler(async (req, res) => {
  const data = await categoryService.listCategories(req.query, {
    includeInactive: true,
  });
  res.json({ success: true, data });
});

const treeAdmin = asyncHandler(async (req, res) => {
  const data = await categoryService.listTree({ includeInactive: true });
  res.json({ success: true, data });
});

const getAdmin = asyncHandler(async (req, res) => {
  const data = await categoryService.getCategoryById(req.params.id);
  res.json({ success: true, data });
});

const listPublic = asyncHandler(async (req, res) => {
  const data = await categoryService.listCategories(req.query, {
    includeInactive: false,
  });
  res.json({ success: true, data });
});

const treePublic = asyncHandler(async (req, res) => {
  const data = await categoryService.listTree({ includeInactive: false });
  res.json({ success: true, data });
});

const getPublic = asyncHandler(async (req, res) => {
  const data = await categoryService.getCategoryById(req.params.id, {
    requireActiveChain: true,
  });
  res.json({ success: true, data });
});

const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: { code: 'FILE_REQUIRED', message: 'Image file is required' },
    });
  }
  const data = await categoryService.setCategoryImage(
    req.params.id,
    req.file,
    req.auth.userId
  );
  res.json({ success: true, data });
});

const audit = asyncHandler(async (req, res) => {
  const data = await categoryService.listCategoryAudit(req.params.id);
  res.json({ success: true, data });
});

const getDirectAttributes = asyncHandler(async (req, res) => {
  const data = await categoryAttributeService.listDirectAssignments(
    req.params.id
  );
  res.json({ success: true, data });
});

const putAttributes = asyncHandler(async (req, res) => {
  const data = await categoryAttributeService.setCategoryAttributes(
    req.params.id,
    req.body.assignments,
    req.auth.userId
  );
  res.json({ success: true, data });
});

const getEffectiveAttributes = asyncHandler(async (req, res) => {
  const data = await categoryAttributeService.getEffectiveAttributes(
    req.params.id,
    { activeOnly: true }
  );
  res.json({ success: true, data });
});

const formSchemaPublic = asyncHandler(async (req, res) => {
  const data = await categoryAttributeService.getFormSchema(req.params.id, {
    publicDiscovery: true,
  });
  res.json({ success: true, data });
});

const formSchemaAdmin = asyncHandler(async (req, res) => {
  const data = await categoryAttributeService.getFormSchema(req.params.id, {
    publicDiscovery: false,
  });
  res.json({ success: true, data });
});

module.exports = {
  create,
  update,
  setStatus,
  move,
  reorder,
  listAdmin,
  treeAdmin,
  getAdmin,
  listPublic,
  treePublic,
  getPublic,
  uploadImage,
  audit,
  getDirectAttributes,
  putAttributes,
  getEffectiveAttributes,
  formSchemaPublic,
  formSchemaAdmin,
};
