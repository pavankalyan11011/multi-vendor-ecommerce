const express = require('express');
const { requireAuth, requireApprovedVendor, requireRoles } = require('../middleware/auth');
const { ROLES } = require('../constants/roles');
const { validateBody, validateQuery } = require('../middleware/validate');
const { businessProfileSchema } = require('../validators/vendorApplication.schemas');
const {
  createProductSchema,
  updateProductSchema,
  setVariantsSchema,
  adjustStockSchema,
  reorderMediaSchema,
  listProductsQuerySchema,
} = require('../validators/product.schemas');
const {
  handleVendorDocumentUpload,
  handleProductImageUpload,
} = require('../middleware/upload');
const vendorApplicationController = require('../controllers/vendorApplication.controller');
const productController = require('../controllers/product.controller');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();

const approvedVendor = [requireAuth, requireApprovedVendor];

router.get(
  '/dashboard',
  requireAuth,
  requireApprovedVendor,
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: {
        message: 'Vendor dashboard',
        userId: req.auth.userId,
        role: req.auth.role,
        status: req.auth.status,
      },
    });
  })
);

router.get(
  '/application',
  requireAuth,
  requireRoles(ROLES.VENDOR),
  vendorApplicationController.getMine
);

router.put(
  '/application',
  requireAuth,
  requireRoles(ROLES.VENDOR),
  validateBody(businessProfileSchema),
  vendorApplicationController.updateMine
);

router.post(
  '/application/submit',
  requireAuth,
  requireRoles(ROLES.VENDOR),
  vendorApplicationController.submitMine
);

router.post(
  '/application/documents',
  requireAuth,
  requireRoles(ROLES.VENDOR),
  handleVendorDocumentUpload,
  vendorApplicationController.uploadDocument
);

router.get(
  '/application/documents/:documentId',
  requireAuth,
  requireRoles(ROLES.VENDOR),
  vendorApplicationController.downloadOwnDocument
);

/* ——— Products (Phase 3B) ——— */
router.get(
  '/products',
  ...approvedVendor,
  validateQuery(listProductsQuerySchema),
  productController.list
);

router.post(
  '/products',
  ...approvedVendor,
  validateBody(createProductSchema),
  productController.create
);

router.get('/products/:id', ...approvedVendor, productController.getOne);

router.patch(
  '/products/:id',
  ...approvedVendor,
  validateBody(updateProductSchema),
  productController.update
);

router.post(
  '/products/:id/submit',
  ...approvedVendor,
  productController.submit
);

router.post(
  '/products/:id/withdraw',
  ...approvedVendor,
  productController.withdraw
);

router.put(
  '/products/:id/variants',
  ...approvedVendor,
  validateBody(setVariantsSchema),
  productController.setVariants
);

router.post(
  '/products/:id/variants/:variantId/stock',
  ...approvedVendor,
  validateBody(adjustStockSchema),
  productController.adjustStock
);

router.post(
  '/products/:id/images',
  ...approvedVendor,
  handleProductImageUpload,
  productController.uploadImage
);

router.delete(
  '/products/:id/images/:mediaId',
  ...approvedVendor,
  productController.deleteImage
);

router.patch(
  '/products/:id/images/reorder',
  ...approvedVendor,
  validateBody(reorderMediaSchema),
  productController.reorderImages
);

module.exports = router;
