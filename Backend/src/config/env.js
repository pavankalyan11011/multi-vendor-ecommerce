function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function expandLocalhostAliases(origins) {
  // Browsers treat localhost and 127.0.0.1 as different origins.
  const expanded = new Set(origins);
  for (const origin of origins) {
    try {
      const url = new URL(origin);
      if (url.hostname === 'localhost') {
        url.hostname = '127.0.0.1';
        expanded.add(url.origin);
      } else if (url.hostname === '127.0.0.1') {
        url.hostname = 'localhost';
        expanded.add(url.origin);
      }
    } catch {
      // ignore invalid entries
    }
  }
  return [...expanded];
}

function parseClientOrigins() {
  // Prefer CLIENT_ORIGINS (comma-separated) for multiple frontends.
  // Fall back to CLIENT_ORIGIN for backward compatibility.
  const raw =
    process.env.CLIENT_ORIGINS ||
    process.env.CLIENT_ORIGIN ||
    'http://localhost:3000,http://localhost:3001,http://localhost:3002';

  const origins = raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return expandLocalhostAliases(origins);
}

/** Ports declared in CLIENT_ORIGINS (e.g. 3000/3001/3002). */
function getClientPorts(clientOrigins) {
  return [
    ...new Set(
      clientOrigins
        .map((origin) => {
          try {
            return new URL(origin).port;
          } catch {
            return '';
          }
        })
        .filter(Boolean)
    ),
  ];
}

/**
 * In development, also allow the same frontend ports on LAN IPs
 * (Next prints Network: http://192.168.x.x:3000).
 */
function isAllowedOrigin(origin, clientOrigins, isProd) {
  if (!origin) return true;
  if (clientOrigins.includes(origin)) return true;
  if (isProd) return false;

  try {
    const url = new URL(origin);
    const ports = getClientPorts(clientOrigins);
    return ports.includes(url.port);
  } catch {
    return false;
  }
}

function loadEnv() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProd = nodeEnv === 'production';
  const clientOrigins = parseClientOrigins();

  return {
    nodeEnv,
    isProd,
    port: Number(process.env.PORT || 5000),
    mongodbUri: requireEnv('MONGODB_URI'),
    clientOrigin: clientOrigins[0],
    clientOrigins,
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

module.exports = { getEnv, loadEnv, resetEnvCache, isAllowedOrigin };
