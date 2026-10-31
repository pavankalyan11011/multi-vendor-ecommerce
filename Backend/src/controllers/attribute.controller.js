const attributeService = require('../services/attribute.service');
const { asyncHandler } = require('../utils/asyncHandler');

const create = asyncHandler(async (req, res) => {
  const data = await attributeService.createAttribute(req.body, req.auth.userId);
  res.status(201).json({ success: true, data });
});

const update = asyncHandler(async (req, res) => {
  const data = await attributeService.updateAttribute(
    req.params.id,
    req.body,
    req.auth.userId
  );
  res.json({ success: true, data });
});

const setStatus = asyncHandler(async (req, res) => {
  const data = await attributeService.setAttributeStatus(
    req.params.id,
    req.body.status,
    req.auth.userId
  );
  res.json({ success: true, data });
});

const getOne = asyncHandler(async (req, res) => {
  const data = await attributeService.getAttributeById(req.params.id);
  res.json({ success: true, data });
});

const list = asyncHandler(async (req, res) => {
  const data = await attributeService.listAttributes(req.query);
  res.json({ success: true, data });
});

module.exports = { create, update, setStatus, getOne, list };
