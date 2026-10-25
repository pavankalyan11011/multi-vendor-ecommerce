const { getEnv } = require('../config/env');
const { ApiError } = require('../utils/ApiError');

/**
 * Cookie-based refresh/logout must come from a trusted Origin (or same-site Referer).
 * Combined with SameSite cookies this reduces CSRF risk.
 */
function requireTrustedOrigin(req, _res, next) {
  const env = getEnv();
  const trusted = new URL(env.clientOrigin);
  const origin = req.get('origin');
  const referer = req.get('referer');

  if (origin) {
    try {
      const o = new URL(origin);
      if (o.origin === trusted.origin) {
        return next();
      }
    } catch {
      // fall through
    }
    return next(new ApiError(403, 'CSRF_REJECTED', 'Untrusted origin'));
  }

  if (referer) {
    try {
      const r = new URL(referer);
      if (r.origin === trusted.origin) {
        return next();
      }
    } catch {
      // fall through
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
