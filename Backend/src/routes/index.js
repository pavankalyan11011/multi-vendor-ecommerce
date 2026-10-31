const express = require('express');
const authRoutes = require('./auth.routes');
const customerRoutes = require('./customer.routes');
const vendorRoutes = require('./vendor.routes');
const adminRoutes = require('./admin.routes');
const categoryRoutes = require('./category.routes');

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

router.use('/auth', authRoutes);
router.use('/customer', customerRoutes);
router.use('/vendor', vendorRoutes);
router.use('/admin', adminRoutes);
router.use('/categories', categoryRoutes);

module.exports = router;
