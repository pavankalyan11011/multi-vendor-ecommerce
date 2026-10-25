const express = require('express');
const authController = require('../controllers/auth.controller');
const { validateBody } = require('../middleware/validate');
const {
  registerSchema,
  vendorRegisterSchema,
  loginSchema,
} = require('../validators/auth.schemas');
const { authRateLimiter } = require('../middleware/rateLimit');
const { requireTrustedOrigin } = require('../middleware/csrf');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/register',
  authRateLimiter,
  validateBody(registerSchema),
  authController.register
);

router.post(
  '/vendor-register',
  authRateLimiter,
  validateBody(vendorRegisterSchema),
  authController.vendorRegister
);

router.post(
  '/login',
  authRateLimiter,
  validateBody(loginSchema),
  authController.login
);

router.post('/refresh', authRateLimiter, requireTrustedOrigin, authController.refresh);
router.post('/logout', authRateLimiter, requireTrustedOrigin, authController.logout);
router.get('/me', requireAuth, authController.me);

module.exports = router;
