const { ZodError } = require('zod');
const { ApiError } = require('../utils/ApiError');

function notFoundHandler(_req, res) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
    },
  });
}

function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: err.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.status).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
  }

  if (err && err.code === 11000) {
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_EMAIL',
        message: 'An account with this email already exists',
      },
    });
  }

  if (err && err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or malformed token',
      },
    });
  }

  if (err && err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Access token has expired',
      },
    });
  }

  console.error(err);
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    },
  });
}

module.exports = { errorHandler, notFoundHandler };
