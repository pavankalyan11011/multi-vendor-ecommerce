const orderService = require('../services/order.service');
const { asyncHandler } = require('../utils/asyncHandler');

const checkout = asyncHandler(async (req, res) => {
  const data = await orderService.checkout(
    req.auth.userId,
    req.body.shippingAddress
  );
  res.status(201).json({ success: true, data });
});

const pay = asyncHandler(async (req, res) => {
  const data = await orderService.payOrder(req.auth.userId, req.params.id);
  res.json({ success: true, data });
});

const createPayment = asyncHandler(async (req, res) => {
  const data = await orderService.createPaymentSession(
    req.auth.userId,
    req.params.id
  );
  res.json({ success: true, data });
});

const verifyPayment = asyncHandler(async (req, res) => {
  const data = await orderService.verifyRazorpayPayment(
    req.auth.userId,
    req.params.id,
    req.body
  );
  res.json({ success: true, data });
});

const listMine = asyncHandler(async (req, res) => {
  const data = await orderService.listCustomerOrders(
    req.auth.userId,
    req.query
  );
  res.json({ success: true, data });
});

const getMine = asyncHandler(async (req, res) => {
  const data = await orderService.getCustomerOrder(
    req.auth.userId,
    req.params.id
  );
  res.json({ success: true, data });
});

const listVendor = asyncHandler(async (req, res) => {
  const data = await orderService.listVendorOrders(req.auth.userId, req.query);
  res.json({ success: true, data });
});

const updateFulfillment = asyncHandler(async (req, res) => {
  const data = await orderService.updateVendorFulfillment(
    req.auth.userId,
    req.params.orderId,
    req.params.itemId,
    req.body.fulfillmentStatus
  );
  res.json({ success: true, data });
});

const listAdmin = asyncHandler(async (req, res) => {
  const data = await orderService.listAdminOrders(req.query);
  res.json({ success: true, data });
});

const getAdmin = asyncHandler(async (req, res) => {
  const data = await orderService.getAdminOrder(req.params.id);
  res.json({ success: true, data });
});

module.exports = {
  checkout,
  pay,
  createPayment,
  verifyPayment,
  listMine,
  getMine,
  listVendor,
  updateFulfillment,
  listAdmin,
  getAdmin,
};
