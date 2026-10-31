const productService = require('../services/product.service');
const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/ApiError');

const create = asyncHandler(async (req, res) => {
  const data = await productService.createProduct(req.body, req.auth.userId);
  res.status(201).json({ success: true, data });
});

const list = asyncHandler(async (req, res) => {
  const data = await productService.listProducts(req.auth.userId, req.query);
  res.json({ success: true, data });
});

const getOne = asyncHandler(async (req, res) => {
  const data = await productService.getProduct(req.params.id, req.auth.userId);
  res.json({ success: true, data });
});

const update = asyncHandler(async (req, res) => {
  const data = await productService.updateProduct(
    req.params.id,
    req.body,
    req.auth.userId
  );
  res.json({ success: true, data });
});

const submit = asyncHandler(async (req, res) => {
  const data = await productService.submitProduct(
    req.params.id,
    req.auth.userId
  );
  res.json({ success: true, data });
});

const withdraw = asyncHandler(async (req, res) => {
  const data = await productService.withdrawProduct(
    req.params.id,
    req.auth.userId
  );
  res.json({ success: true, data });
});

const setVariants = asyncHandler(async (req, res) => {
  const data = await productService.setVariants(
    req.params.id,
    req.body.variants,
    req.auth.userId
  );
  res.json({ success: true, data });
});

const adjustStock = asyncHandler(async (req, res) => {
  const data = await productService.adjustStock(
    req.params.id,
    req.params.variantId,
    req.body.delta,
    req.auth.userId
  );
  res.json({ success: true, data });
});

const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'FILE_REQUIRED', 'Image file is required');
  }
  const data = await productService.addProductImage(
    req.params.id,
    req.file,
    req.auth.userId
  );
  res.status(201).json({ success: true, data });
});

const deleteImage = asyncHandler(async (req, res) => {
  const data = await productService.deleteProductImage(
    req.params.id,
    req.params.mediaId,
    req.auth.userId
  );
  res.json({ success: true, data });
});

const reorderImages = asyncHandler(async (req, res) => {
  const data = await productService.reorderProductImages(
    req.params.id,
    req.body.orderedIds,
    req.auth.userId
  );
  res.json({ success: true, data });
});

module.exports = {
  create,
  list,
  getOne,
  update,
  submit,
  withdraw,
  setVariants,
  adjustStock,
  uploadImage,
  deleteImage,
  reorderImages,
};
