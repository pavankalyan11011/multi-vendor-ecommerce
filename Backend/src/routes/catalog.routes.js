const express = require('express');
const { validateQuery } = require('../middleware/validate');
const {
  listPublicProductsQuerySchema,
} = require('../validators/product.schemas');
const productModerationController = require('../controllers/productModeration.controller');

const router = express.Router();

/** Public catalog — APPROVED products with publishedSnapshot only. */
router.get(
  '/',
  validateQuery(listPublicProductsQuerySchema),
  productModerationController.listPublic
);

router.get('/:id', productModerationController.getPublic);

module.exports = router;
