const express = require('express');
const { validateQuery } = require('../middleware/validate');
const { listCategoriesQuerySchema } = require('../validators/category.schemas');
const categoryController = require('../controllers/category.controller');

const router = express.Router();

router.get(
  '/',
  validateQuery(listCategoriesQuerySchema),
  categoryController.listPublic
);

router.get('/tree', categoryController.treePublic);

router.get('/:id/form-schema', categoryController.formSchemaPublic);

router.get('/:id/attributes', categoryController.getEffectiveAttributes);

router.get('/:id', categoryController.getPublic);

module.exports = router;
