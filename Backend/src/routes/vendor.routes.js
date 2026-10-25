const express = require('express');
const { requireAuth, requireApprovedVendor } = require('../middleware/auth');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();

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

module.exports = router;
