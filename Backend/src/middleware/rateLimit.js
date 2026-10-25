const rateLimit = require('express-rate-limit');

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many authentication attempts. Please try again later.',
    },
  },
});

module.exports = { authRateLimiter };
