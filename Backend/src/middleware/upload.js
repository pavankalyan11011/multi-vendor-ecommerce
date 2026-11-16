const multer = require('multer');
const { ApiError } = require('../utils/ApiError');
const { STORAGE_FOLDERS } = require('../constants/storageFolders');
const { persistUpload } = require('../storage');

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

const memory = multer.memoryStorage();

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
  if (!buffer || buffer.length < 3) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
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

function assertImageSignature(buffer) {
  const detected = detectImageMime(buffer);
  if (!detected) {
    throw new ApiError(
      400,
      'INVALID_FILE_SIGNATURE',
      'File content is not a valid JPEG, PNG, or WEBP image'
    );
  }
  return detected;
}

function wrapMulter(upload, { requireFile = false, persistFolder, validateImage } = {}) {
  return (req, res, next) => {
    upload(req, res, async (err) => {
      if (err) {
        if (err instanceof ApiError) return next(err);
        if (err.code === 'LIMIT_FILE_SIZE') {
          const msg =
            persistFolder === STORAGE_FOLDERS.VENDOR_DOCS
              ? 'Document must be 5MB or smaller'
              : 'Image must be 2MB or smaller';
          return next(new ApiError(400, 'FILE_TOO_LARGE', msg));
        }
        return next(
          new ApiError(400, 'UPLOAD_FAILED', err.message || 'Upload failed')
        );
      }

      if (!req.file) {
        if (requireFile) {
          return next(new ApiError(400, 'VALIDATION_ERROR', 'File is required'));
        }
        return next();
      }

      try {
        if (validateImage) {
          req.file.mimetype = assertImageSignature(req.file.buffer);
        }
        if (persistFolder) {
          await persistUpload(persistFolder, req.file);
        }
        return next();
      } catch (e) {
        return next(e);
      }
    });
  };
}

const vendorDocumentUpload = multer({
  storage: memory,
  fileFilter,
  limits: { fileSize: MAX_BYTES, files: 1 },
}).single('document');

const categoryImageUpload = multer({
  storage: memory,
  fileFilter: categoryImageFilter,
  limits: { fileSize: CATEGORY_IMAGE_MAX_BYTES, files: 1 },
}).single('image');

const productImageUpload = multer({
  storage: memory,
  fileFilter: categoryImageFilter,
  limits: { fileSize: CATEGORY_IMAGE_MAX_BYTES, files: 1 },
}).single('image');

const handleVendorDocumentUpload = wrapMulter(vendorDocumentUpload, {
  persistFolder: STORAGE_FOLDERS.VENDOR_DOCS,
});

const handleCategoryImageUpload = wrapMulter(categoryImageUpload, {
  persistFolder: STORAGE_FOLDERS.CATEGORY_IMAGES,
  validateImage: true,
});

const handleProductImageUpload = wrapMulter(productImageUpload, {
  persistFolder: STORAGE_FOLDERS.PRODUCT_IMAGES,
  validateImage: true,
});

module.exports = {
  handleVendorDocumentUpload,
  handleCategoryImageUpload,
  handleProductImageUpload,
  ALLOWED_MIME,
  CATEGORY_IMAGE_MIME,
  MAX_BYTES,
  CATEGORY_IMAGE_MAX_BYTES,
};
