const cartService = require('../services/cart.service');
const { asyncHandler } = require('../utils/asyncHandler');

const getCart = asyncHandler(async (req, res) => {
  const data = await cartService.getCart(req.auth.userId);
  res.json({ success: true, data });
});

const upsertItem = asyncHandler(async (req, res) => {
  const data = await cartService.upsertCartItem(req.auth.userId, req.body);
  res.status(200).json({ success: true, data });
});

const setQuantity = asyncHandler(async (req, res) => {
  const data = await cartService.setCartItemQuantity(
    req.auth.userId,
    req.params.productId,
    req.body.quantity,
    req.body.variantId
  );
  res.json({ success: true, data });
});

const removeItem = asyncHandler(async (req, res) => {
  const data = await cartService.removeCartItem(
    req.auth.userId,
    req.params.productId,
    req.query.variantId
  );
  res.json({ success: true, data });
});

const clear = asyncHandler(async (req, res) => {
  const data = await cartService.clearCart(req.auth.userId);
  res.json({ success: true, data });
});

module.exports = {
  getCart,
  upsertItem,
  setQuantity,
  removeItem,
  clear,
};
