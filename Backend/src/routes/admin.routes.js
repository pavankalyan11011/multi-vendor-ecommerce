const express = require('express');
const {
  requireAuth,
  requireRoles,
  requireActiveAccount,
} = require('../middleware/auth');
const { ROLES } = require('../constants/roles');
const { validateBody, validateQuery } = require('../middleware/validate');
const {
  rejectApplicationSchema,
  suspendAccountSchema,
  listApplicationsQuerySchema,
} = require('../validators/vendorApplication.schemas');
const {
  createCategorySchema,
  updateCategorySchema,
  categoryStatusSchema,
  moveCategorySchema,
  reorderCategoriesSchema,
  listCategoriesQuerySchema,
  setCategoryAttributesSchema,
} = require('../validators/category.schemas');
const {
  createAttributeSchema,
  updateAttributeSchema,
  attributeStatusSchema,
  listAttributesQuerySchema,
} = require('../validators/attribute.schemas');
const vendorApplicationController = require('../controllers/vendorApplication.controller');
const categoryController = require('../controllers/category.controller');
const attributeController = require('../controllers/attribute.controller');
const { handleCategoryImageUpload } = require('../middleware/upload');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();

const adminGate = [
  requireAuth,
  requireRoles(ROLES.ADMIN),
  requireActiveAccount,
];

router.get(
  '/dashboard',
  ...adminGate,
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: {
        message: 'Admin dashboard',
        userId: req.auth.userId,
        role: req.auth.role,
      },
    });
  })
);

router.get(
  '/vendor-applications',
  ...adminGate,
  validateQuery(listApplicationsQuerySchema),
  vendorApplicationController.listApplications
);

router.get(
  '/vendor-applications/:id',
  ...adminGate,
  vendorApplicationController.getApplication
);

router.post(
  '/vendor-applications/:id/approve',
  ...adminGate,
  vendorApplicationController.approveApplication
);

router.post(
  '/vendor-applications/:id/reject',
  ...adminGate,
  validateBody(rejectApplicationSchema),
  vendorApplicationController.rejectApplication
);

router.post(
  '/vendors/:userId/suspend',
  ...adminGate,
  validateBody(suspendAccountSchema),
  vendorApplicationController.suspendAccount
);

router.post(
  '/vendors/:userId/reactivate',
  ...adminGate,
  vendorApplicationController.reactivateAccount
);

router.get(
  '/vendor-documents/:documentId',
  ...adminGate,
  vendorApplicationController.downloadAdminDocument
);

/* ——— Catalog: categories ——— */
router.get('/categories/tree', ...adminGate, categoryController.treeAdmin);

router.patch(
  '/categories/reorder',
  ...adminGate,
  validateBody(reorderCategoriesSchema),
  categoryController.reorder
);

router.get(
  '/categories',
  ...adminGate,
  validateQuery(listCategoriesQuerySchema),
  categoryController.listAdmin
);

router.post(
  '/categories',
  ...adminGate,
  validateBody(createCategorySchema),
  categoryController.create
);

router.get('/categories/:id', ...adminGate, categoryController.getAdmin);

router.patch(
  '/categories/:id',
  ...adminGate,
  validateBody(updateCategorySchema),
  categoryController.update
);

router.patch(
  '/categories/:id/status',
  ...adminGate,
  validateBody(categoryStatusSchema),
  categoryController.setStatus
);

router.patch(
  '/categories/:id/move',
  ...adminGate,
  validateBody(moveCategorySchema),
  categoryController.move
);

router.post(
  '/categories/:id/image',
  ...adminGate,
  handleCategoryImageUpload,
  categoryController.uploadImage
);

router.get('/categories/:id/audit', ...adminGate, categoryController.audit);

router.get(
  '/categories/:id/attributes',
  ...adminGate,
  categoryController.getDirectAttributes
);

router.put(
  '/categories/:id/attributes',
  ...adminGate,
  validateBody(setCategoryAttributesSchema),
  categoryController.putAttributes
);

router.get(
  '/categories/:id/form-schema',
  ...adminGate,
  categoryController.formSchemaAdmin
);

/* ——— Catalog: attributes ——— */
router.get(
  '/attributes',
  ...adminGate,
  validateQuery(listAttributesQuerySchema),
  attributeController.list
);

router.post(
  '/attributes',
  ...adminGate,
  validateBody(createAttributeSchema),
  attributeController.create
);

router.get('/attributes/:id', ...adminGate, attributeController.getOne);

router.patch(
  '/attributes/:id',
  ...adminGate,
  validateBody(updateAttributeSchema),
  attributeController.update
);

router.patch(
  '/attributes/:id/status',
  ...adminGate,
  validateBody(attributeStatusSchema),
  attributeController.setStatus
);

module.exports = router;
