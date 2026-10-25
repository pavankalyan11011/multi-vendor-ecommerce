process.env.NODE_ENV = 'test';
process.env.CLIENT_ORIGIN = 'http://localhost:3000';
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ||
  'test_access_secret_0123456789abcdef0123456789abcdef';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ||
  'test_refresh_secret_0123456789abcdef0123456789abcdef';
process.env.JWT_ISSUER = 'multi-vendor-ecommerce-test';
process.env.JWT_AUDIENCE = 'multi-vendor-ecommerce-api-test';
process.env.JWT_ACCESS_TTL = '15m';
process.env.JWT_REFRESH_TTL_MS = String(7 * 24 * 60 * 60 * 1000);
process.env.REFRESH_COOKIE_NAME = 'refreshToken';
process.env.BCRYPT_ROUNDS = '4';
process.env.MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/test-placeholder';
