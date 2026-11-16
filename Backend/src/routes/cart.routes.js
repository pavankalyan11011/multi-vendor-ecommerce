const express = require('express');
const {
  requireAuth,
  requireRoles,
  requireActiveAccount,
} = require('../middleware/auth');
const { ROLES } = require('../constants/roles');
const { validateBody, validateQuery } = require('../middleware/validate');
const {
  upsertCartItemSchema,
  setCartItemQuantitySchema,
  removeCartItemQuerySchema,
} = require('../validators/cart.schemas');
const cartController = require('../controllers/cart.controller');

const router = express.Router();

const customerGate = [
  requireAuth,
  requireRoles(ROLES.CUSTOMER),
  requireActiveAccount,
];

router.get('/', ...customerGate, cartController.getCart);

router.post(
  '/items',
  ...customerGate,
  validateBody(upsertCartItemSchema),
  cartController.upsertItem
);

router.patch(
  '/items/:productId',
  ...customerGate,
  validateBody(setCartItemQuantitySchema),
  cartController.setQuantity
);

router.delete(
  '/items/:productId',
  ...customerGate,
  validateQuery(removeCartItemQuerySchema),
  cartController.removeItem
);

router.delete('/', ...customerGate, cartController.clear);

module.exports = router;
