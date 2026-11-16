const express = require('express');
const {
  requireAuth,
  requireRoles,
  requireActiveAccount,
} = require('../middleware/auth');
const { ROLES } = require('../constants/roles');
const { validateBody, validateQuery } = require('../middleware/validate');
const {
  checkoutSchema,
  listOrdersQuerySchema,
  verifyRazorpaySchema,
} = require('../validators/order.schemas');
const orderController = require('../controllers/order.controller');

const router = express.Router();

const customerGate = [
  requireAuth,
  requireRoles(ROLES.CUSTOMER),
  requireActiveAccount,
];

router.post(
  '/checkout',
  ...customerGate,
  validateBody(checkoutSchema),
  orderController.checkout
);

router.get(
  '/me',
  ...customerGate,
  validateQuery(listOrdersQuerySchema),
  orderController.listMine
);

router.get('/me/:id', ...customerGate, orderController.getMine);

router.post(
  '/:id/payments/razorpay',
  ...customerGate,
  orderController.createPayment
);

router.post(
  '/:id/payments/verify',
  ...customerGate,
  validateBody(verifyRazorpaySchema),
  orderController.verifyPayment
);

/** Stub pay — only when Razorpay is unset or stub mode / tests. */
router.post('/:id/pay', ...customerGate, orderController.pay);

module.exports = router;
