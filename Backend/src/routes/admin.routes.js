const express = require('express');
const {
  requireAuth,
  requireRoles,
  requireActiveAccount,
} = require('../middleware/auth');
const { ROLES } = require('../constants/roles');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();

router.get(
  '/dashboard',
  requireAuth,
  requireRoles(ROLES.ADMIN),
  requireActiveAccount,
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

module.exports = router;
