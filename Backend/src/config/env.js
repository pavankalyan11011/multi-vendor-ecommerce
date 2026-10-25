function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function loadEnv() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProd = nodeEnv === 'production';

  return {
    nodeEnv,
    isProd,
    port: Number(process.env.PORT || 5000),
    mongodbUri: requireEnv('MONGODB_URI'),
    clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
    jwtAccessSecret: requireEnv('JWT_ACCESS_SECRET'),
    jwtRefreshSecret: requireEnv('JWT_REFRESH_SECRET'),
    jwtIssuer: process.env.JWT_ISSUER || 'multi-vendor-ecommerce',
    jwtAudience: process.env.JWT_AUDIENCE || 'multi-vendor-ecommerce-api',
    accessTokenTtl: process.env.JWT_ACCESS_TTL || '15m',
    refreshTokenTtlMs: Number(process.env.JWT_REFRESH_TTL_MS || 7 * 24 * 60 * 60 * 1000),
    cookieName: process.env.REFRESH_COOKIE_NAME || 'refreshToken',
    bcryptRounds: Number(process.env.BCRYPT_ROUNDS || 12),
  };
}

let cached;

function getEnv() {
  if (!cached) {
    cached = loadEnv();
  }
  return cached;
}

function resetEnvCache() {
  cached = undefined;
}

module.exports = { getEnv, loadEnv, resetEnvCache };
