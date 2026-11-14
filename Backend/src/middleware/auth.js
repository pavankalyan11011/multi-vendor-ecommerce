const { User } = require('../models/User');
const {
  VendorApplication,
} = require('../models/VendorApplication');
const { ApiError } = require('../utils/ApiError');
const { verifyAccessToken } = require('../utils/tokens');
const { STATUSES } = require('../constants/statuses');
const { APPLICATION_STATUSES } = require('../constants/applicationStatuses');
const {
  ROLES,
  normalizeRoles,
  pickPrimaryRole,
  userHasRole,
  userHasAnyRole,
} = require('../constants/roles');

async function requireAuth(req, _res, next) {
  try {
    const header = req.get('authorization') || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new ApiError(401, 'TOKEN_EXPIRED', 'Access token has expired');
      }
      throw new ApiError(401, 'INVALID_TOKEN', 'Invalid or malformed token');
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    if (user.status === STATUSES.SUSPENDED) {
      throw new ApiError(403, 'ACCOUNT_SUSPENDED', 'Account is suspended');
    }

    const roles = normalizeRoles(user);
    // Never trust client-provided role/status — reload from DB
    req.auth = {
      userId: user._id.toString(),
      role: pickPrimaryRole(roles),
      roles,
      status: user.status,
      user,
    };
    return next();
  } catch (err) {
    return next(err);
  }
}

function requireRoles(...roles) {
  return (req, _res, next) => {
    if (!req.auth) {
      return next(new ApiError(401, 'UNAUTHORIZED', 'Authentication required'));
    }
    if (!userHasAnyRole(req.auth, roles)) {
      return next(new ApiError(403, 'FORBIDDEN', 'Insufficient role privileges'));
    }
    return next();
  };
}

async function requireApprovedVendor(req, _res, next) {
  try {
    if (!req.auth) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');
    }
    if (!userHasRole(req.auth, ROLES.VENDOR)) {
      throw new ApiError(403, 'FORBIDDEN', 'Vendor role required');
    }
    if (req.auth.status === STATUSES.SUSPENDED) {
      throw new ApiError(
        403,
        'VENDOR_NOT_APPROVED',
        'Vendor account is pending approval or not active'
      );
    }

    if (req.auth.status !== STATUSES.ACTIVE) {
      throw new ApiError(
        403,
        'VENDOR_NOT_APPROVED',
        'Vendor account is pending approval or not active'
      );
    }

    const application = await VendorApplication.findOne({
      userId: req.auth.userId,
    }).lean();

    // If an application exists, it must be APPROVED (multi-role ACTIVE
    // customers who just added VENDOR stay blocked until admin approval).
    // Legacy ACTIVE vendors with no application row remain allowed.
    if (
      application &&
      application.applicationStatus !== APPLICATION_STATUSES.APPROVED
    ) {
      throw new ApiError(
        403,
        'VENDOR_NOT_APPROVED',
        'Vendor account is pending approval or not active'
      );
    }

    return next();
  } catch (err) {
    return next(err);
  }
}

function requireActiveAccount(req, _res, next) {
  if (!req.auth) {
    return next(new ApiError(401, 'UNAUTHORIZED', 'Authentication required'));
  }
  if (req.auth.status !== STATUSES.ACTIVE) {
    return next(
      new ApiError(403, 'ACCOUNT_NOT_ACTIVE', 'Account is not active')
    );
  }
  return next();
}

/**
 * Ensure the authenticated user owns the resource identified by param/body field.
 */
function requireSelf(paramName = 'userId') {
  return (req, _res, next) => {
    if (!req.auth) {
      return next(new ApiError(401, 'UNAUTHORIZED', 'Authentication required'));
    }
    const resourceUserId =
      req.params[paramName] || req.body[paramName] || req.query[paramName];
    if (!resourceUserId || resourceUserId !== req.auth.userId) {
      return next(new ApiError(403, 'FORBIDDEN', 'Resource ownership required'));
    }
    return next();
  };
}

module.exports = {
  requireAuth,
  requireRoles,
  requireApprovedVendor,
  requireActiveAccount,
  requireSelf,
};
