const fs = require('fs');
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');
const { ApiError } = require('../utils/ApiError');
const { uploadsDir } = require('../services/vendorApplication.service');
const { categoryUploadsDir } = require('../services/category.service');
const { productUploadsDir } = require('../services/product.service');

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const CATEGORY_IMAGE_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const CATEGORY_IMAGE_MAX_BYTES = 2 * 1024 * 1024; // 2MB

function ensureUploadDir() {
  const dir = uploadsDir();
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function ensureCategoryUploadDir() {
  const dir = categoryUploadsDir();
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function ensureProductUploadDir() {
  const dir = productUploadsDir();
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, ensureUploadDir());
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase().slice(0, 10);
    const name = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, name);
  },
});

const categoryImageStorage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, ensureCategoryUploadDir());
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase().slice(0, 10);
    const name = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, name);
  },
});

function fileFilter(_req, file, cb) {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    return cb(
      new ApiError(
        400,
        'INVALID_FILE_TYPE',
        'Only PDF, JPEG, PNG, and WEBP files are allowed'
      )
    );
  }
  return cb(null, true);
}

function categoryImageFilter(_req, file, cb) {
  if (!CATEGORY_IMAGE_MIME.has(file.mimetype)) {
    return cb(
      new ApiError(
        400,
        'INVALID_FILE_TYPE',
        'Only JPEG, PNG, and WEBP images are allowed'
      )
    );
  }
  return cb(null, true);
}

function detectImageMime(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png';
  }
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

function assertCategoryImageSignature(filePath) {
  const fd = fs.openSync(filePath, 'r');
  try {
    const buf = Buffer.alloc(16);
    fs.readSync(fd, buf, 0, 16, 0);
    const detected = detectImageMime(buf);
    if (!detected) {
      throw new ApiError(
        400,
        'INVALID_FILE_SIGNATURE',
        'File content is not a valid JPEG, PNG, or WEBP image'
      );
    }
    return detected;
  } finally {
    fs.closeSync(fd);
  }
}

const vendorDocumentUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_BYTES, files: 1 },
}).single('document');

const categoryImageUpload = multer({
  storage: categoryImageStorage,
  fileFilter: categoryImageFilter,
  limits: { fileSize: CATEGORY_IMAGE_MAX_BYTES, files: 1 },
}).single('image');

const productImageStorage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, ensureProductUploadDir());
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase().slice(0, 10);
    const name = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, name);
  },
});

const productImageUpload = multer({
  storage: productImageStorage,
  fileFilter: categoryImageFilter,
  limits: { fileSize: CATEGORY_IMAGE_MAX_BYTES, files: 1 },
}).single('image');

function handleVendorDocumentUpload(req, res, next) {
  vendorDocumentUpload(req, res, (err) => {
    if (!err) return next();
    if (err instanceof ApiError) return next(err);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(
        new ApiError(400, 'FILE_TOO_LARGE', 'Document must be 5MB or smaller')
      );
    }
    return next(
      new ApiError(400, 'UPLOAD_FAILED', err.message || 'Upload failed')
    );
  });
}

function handleCategoryImageUpload(req, res, next) {
  categoryImageUpload(req, res, (err) => {
    if (err) {
      if (err instanceof ApiError) return next(err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(
          new ApiError(400, 'FILE_TOO_LARGE', 'Image must be 2MB or smaller')
        );
      }
      return next(
        new ApiError(400, 'UPLOAD_FAILED', err.message || 'Upload failed')
      );
    }
    if (!req.file) return next();
    try {
      const detected = assertCategoryImageSignature(req.file.path);
      req.file.mimetype = detected;
      return next();
    } catch (signatureErr) {
      fs.unlink(req.file.path, () => undefined);
      return next(signatureErr);
    }
  });
}

function handleProductImageUpload(req, res, next) {
  productImageUpload(req, res, (err) => {
    if (err) {
      if (err instanceof ApiError) return next(err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(
          new ApiError(400, 'FILE_TOO_LARGE', 'Image must be 2MB or smaller')
        );
      }
      return next(
        new ApiError(400, 'UPLOAD_FAILED', err.message || 'Upload failed')
      );
    }
    if (!req.file) return next();
    try {
      const detected = assertCategoryImageSignature(req.file.path);
      req.file.mimetype = detected;
      return next();
    } catch (signatureErr) {
      fs.unlink(req.file.path, () => undefined);
      return next(signatureErr);
    }
  });
}

module.exports = {
  handleVendorDocumentUpload,
  handleCategoryImageUpload,
  handleProductImageUpload,
  ALLOWED_MIME,
  CATEGORY_IMAGE_MIME,
  MAX_BYTES,
  CATEGORY_IMAGE_MAX_BYTES,
};
