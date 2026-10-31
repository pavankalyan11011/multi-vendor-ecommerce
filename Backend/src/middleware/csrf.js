const { getEnv, isAllowedOrigin } = require('../config/env');
const { ApiError } = require('../utils/ApiError');

function isTrustedOrigin(value, env) {
  try {
    const parsed = new URL(value);
    return isAllowedOrigin(parsed.origin, env.clientOrigins, env.isProd);
  } catch {
    return false;
  }
}

/**
 * Cookie-based refresh/logout must come from a trusted Origin (or same-site Referer).
 * Supports multiple frontend apps via CLIENT_ORIGINS.
 */
function requireTrustedOrigin(req, _res, next) {
  const env = getEnv();
  const origin = req.get('origin');
  const referer = req.get('referer');

  if (origin) {
    if (isTrustedOrigin(origin, env)) {
      return next();
    }
    return next(new ApiError(403, 'CSRF_REJECTED', 'Untrusted origin'));
  }

  if (referer) {
    if (isTrustedOrigin(referer, env)) {
      return next();
    }
    return next(new ApiError(403, 'CSRF_REJECTED', 'Untrusted referer'));
  }

  // Allow non-browser clients (e.g. tests/Postman) in non-production when neither header is set.
  if (!env.isProd) {
    return next();
  }

  return next(new ApiError(403, 'CSRF_REJECTED', 'Missing Origin or Referer'));
}

module.exports = { requireTrustedOrigin };
