const { ApiError } = require('../utils/ApiError');
const { ATTRIBUTE_DATA_TYPES } = require('../constants/attributeTypes');

function validateAttributeValue(field, rawValue) {
  const label = field.code || field.name;
  if (
    (rawValue === undefined || rawValue === null || rawValue === '') &&
    field.required
  ) {
    throw new ApiError(
      400,
      'ATTRIBUTE_REQUIRED',
      `Attribute "${label}" is required`,
      { code: field.code }
    );
  }
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return undefined;
  }

  const validation = field.validation || {};

  switch (field.dataType) {
    case ATTRIBUTE_DATA_TYPES.STRING: {
      const value = String(rawValue);
      if (
        validation.minLength != null &&
        value.length < validation.minLength
      ) {
        throw new ApiError(
          400,
          'ATTRIBUTE_INVALID',
          `"${label}" is too short`,
          { code: field.code }
        );
      }
      if (
        validation.maxLength != null &&
        value.length > validation.maxLength
      ) {
        throw new ApiError(
          400,
          'ATTRIBUTE_INVALID',
          `"${label}" is too long`,
          { code: field.code }
        );
      }
      if (validation.pattern) {
        const re = new RegExp(validation.pattern);
        if (!re.test(value)) {
          throw new ApiError(
            400,
            'ATTRIBUTE_INVALID',
            `"${label}" does not match required pattern`,
            { code: field.code }
          );
        }
      }
      return value;
    }
    case ATTRIBUTE_DATA_TYPES.NUMBER: {
      const value = Number(rawValue);
      if (!Number.isFinite(value)) {
        throw new ApiError(
          400,
          'ATTRIBUTE_INVALID',
          `"${label}" must be a number`,
          { code: field.code }
        );
      }
      if (validation.min != null && value < validation.min) {
        throw new ApiError(
          400,
          'ATTRIBUTE_INVALID',
          `"${label}" is below minimum`,
          { code: field.code }
        );
      }
      if (validation.max != null && value > validation.max) {
        throw new ApiError(
          400,
          'ATTRIBUTE_INVALID',
          `"${label}" is above maximum`,
          { code: field.code }
        );
      }
      return value;
    }
    case ATTRIBUTE_DATA_TYPES.BOOLEAN: {
      if (typeof rawValue === 'boolean') return rawValue;
      if (rawValue === 'true' || rawValue === '1') return true;
      if (rawValue === 'false' || rawValue === '0') return false;
      throw new ApiError(
        400,
        'ATTRIBUTE_INVALID',
        `"${label}" must be boolean`,
        { code: field.code }
      );
    }
    case ATTRIBUTE_DATA_TYPES.ENUM: {
      const value = String(rawValue);
      const allowed = new Set((field.options || []).map((o) => o.value));
      if (!allowed.has(value)) {
        throw new ApiError(
          400,
          'ATTRIBUTE_INVALID',
          `"${label}" has an invalid option`,
          { code: field.code }
        );
      }
      return value;
    }
    case ATTRIBUTE_DATA_TYPES.MULTI_SELECT: {
      const values = Array.isArray(rawValue) ? rawValue.map(String) : [String(rawValue)];
      const allowed = new Set((field.options || []).map((o) => o.value));
      for (const v of values) {
        if (!allowed.has(v)) {
          throw new ApiError(
            400,
            'ATTRIBUTE_INVALID',
            `"${label}" contains an invalid option`,
            { code: field.code }
          );
        }
      }
      return values;
    }
    case ATTRIBUTE_DATA_TYPES.DATE: {
      const value = String(rawValue);
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) {
        throw new ApiError(
          400,
          'ATTRIBUTE_INVALID',
          `"${label}" must be a valid date`,
          { code: field.code }
        );
      }
      return value;
    }
    default:
      throw new ApiError(
        400,
        'ATTRIBUTE_INVALID',
        `Unsupported data type for "${label}"`,
        { code: field.code }
      );
  }
}

function buildAttributeValuesFromInput(fields, inputValues) {
  const byCode = new Map();
  const byId = new Map();
  for (const item of inputValues || []) {
    if (item.attributeId) byId.set(String(item.attributeId), item.value);
    if (item.code) byCode.set(String(item.code), item.value);
  }

  const result = [];
  for (const field of fields) {
    const raw =
      byId.has(field.attributeId)
        ? byId.get(field.attributeId)
        : byCode.get(field.code);
    const value = validateAttributeValue(field, raw);
    if (value === undefined) continue;
    result.push({
      attributeId: field.attributeId,
      code: field.code,
      attributeSchemaVersion: field.attributeSchemaVersion,
      value,
    });
  }

  // Reject unknown attribute codes/ids sent by client
  for (const item of inputValues || []) {
    const known =
      fields.some((f) => f.attributeId === String(item.attributeId)) ||
      fields.some((f) => f.code === item.code);
    if (!known && (item.attributeId || item.code)) {
      throw new ApiError(
        400,
        'ATTRIBUTE_UNKNOWN',
        `Unknown attribute ${item.code || item.attributeId}`
      );
    }
  }

  return result;
}

function detectSchemaOutdated(product, formSchema) {
  if (product.categorySchemaVersion !== formSchema.schemaVersion) {
    return true;
  }
  const byId = new Map(
    formSchema.fields.map((f) => [f.attributeId, f.attributeSchemaVersion])
  );
  for (const av of product.attributeValues || []) {
    const current = byId.get(String(av.attributeId));
    if (current == null) return true;
    if (current !== av.attributeSchemaVersion) return true;
  }
  return false;
}

module.exports = {
  validateAttributeValue,
  buildAttributeValuesFromInput,
  detectSchemaOutdated,
};
