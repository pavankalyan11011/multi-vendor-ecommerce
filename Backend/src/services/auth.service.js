const crypto = require('crypto');
const { User } = require('../models/User');
const { RefreshToken } = require('../models/RefreshToken');
const { ROLES } = require('../constants/roles');
const { STATUSES } = require('../constants/statuses');
const { ApiError } = require('../utils/ApiError');
const { hashPassword, verifyPassword } = require('../utils/password');
const {
  hashToken,
  generateRefreshToken,
  signAccessToken,
  accessTokenExpiresInSeconds,
} = require('../utils/tokens');
const { getEnv } = require('../config/env');
const {
  ensureVendorApplication,
} = require('./vendorApplication.service');

function toPublicUser(user) {
  const obj = typeof user.toJSON === 'function' ? user.toJSON() : { ...user };
  delete obj.passwordHash;
  return {
    id: obj._id?.toString?.() || obj.id,
    fullName: obj.fullName,
    email: obj.email,
    role: obj.role,
    status: obj.status,
    emailVerified: obj.emailVerified,
    lastLoginAt: obj.lastLoginAt,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}

async function registerCustomer({ fullName, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail }).lean();
  if (existing) {
    throw new ApiError(409, 'DUPLICATE_EMAIL', 'An account with this email already exists');
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    fullName: fullName.trim(),
    email: normalizedEmail,
    passwordHash,
    role: ROLES.CUSTOMER,
    status: STATUSES.ACTIVE,
    emailVerified: false,
  });

  return toPublicUser(user);
}

async function registerVendor({ fullName, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail }).lean();
  if (existing) {
    throw new ApiError(409, 'DUPLICATE_EMAIL', 'An account with this email already exists');
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    fullName: fullName.trim(),
    email: normalizedEmail,
    passwordHash,
    role: ROLES.VENDOR,
    status: STATUSES.PENDING,
    emailVerified: false,
  });

  // Separate application record (DRAFT) — business onboarding is Phase 2.
  await ensureVendorApplication(user._id);

  return toPublicUser(user);
}

async function createRefreshSession(user, meta = {}) {
  const env = getEnv();
  const rawToken = generateRefreshToken();
  const tokenHash = hashToken(rawToken);
  const familyId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + env.refreshTokenTtlMs);

  await RefreshToken.create({
    userId: user._id,
    tokenHash,
    familyId,
    expiresAt,
    userAgent: meta.userAgent || null,
    ip: meta.ip || null,
  });

  return { rawToken, expiresAt };
}

async function issueAuthSession(user, meta = {}) {
  const accessToken = signAccessToken(user);
  const { rawToken, expiresAt } = await createRefreshSession(user, meta);
  return {
    accessToken,
    expiresIn: accessTokenExpiresInSeconds(),
    refreshToken: rawToken,
    refreshExpiresAt: expiresAt,
    user: toPublicUser(user),
  };
}

async function login({ email, password }, meta = {}) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

  // Anti-enumeration: identical message for unknown email / bad password
  const invalid = new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');

  if (!user) {
    throw invalid;
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    throw invalid;
  }

  if (user.status === STATUSES.SUSPENDED) {
    throw new ApiError(403, 'ACCOUNT_SUSPENDED', 'Account is suspended');
  }

  user.lastLoginAt = new Date();
  await user.save();

  return issueAuthSession(user, meta);
}

async function rotateRefreshToken(rawToken, meta = {}) {
  if (!rawToken) {
    throw new ApiError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token required');
  }

  const tokenHash = hashToken(rawToken);
  const existing = await RefreshToken.findOne({ tokenHash });

  if (!existing) {
    throw new ApiError(401, 'INVALID_REFRESH_TOKEN', 'Invalid refresh token');
  }

  if (existing.revokedAt) {
    // Replay detection: revoke entire token family
    await RefreshToken.updateMany(
      { familyId: existing.familyId, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
    throw new ApiError(401, 'REFRESH_TOKEN_REUSE', 'Refresh token reuse detected');
  }

  if (existing.expiresAt.getTime() <= Date.now()) {
    existing.revokedAt = new Date();
    await existing.save();
    throw new ApiError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token expired');
  }

  const user = await User.findById(existing.userId);
  if (!user || user.status === STATUSES.SUSPENDED) {
    existing.revokedAt = new Date();
    await existing.save();
    throw new ApiError(401, 'INVALID_REFRESH_TOKEN', 'Invalid refresh token');
  }

  const env = getEnv();
  const newRaw = generateRefreshToken();
  const newHash = hashToken(newRaw);
  const expiresAt = new Date(Date.now() + env.refreshTokenTtlMs);

  existing.revokedAt = new Date();
  existing.replacedByHash = newHash;
  await existing.save();

  await RefreshToken.create({
    userId: user._id,
    tokenHash: newHash,
    familyId: existing.familyId,
    expiresAt,
    userAgent: meta.userAgent || null,
    ip: meta.ip || null,
  });

  return {
    accessToken: signAccessToken(user),
    expiresIn: accessTokenExpiresInSeconds(),
    refreshToken: newRaw,
    refreshExpiresAt: expiresAt,
    user: toPublicUser(user),
  };
}

async function logout(rawToken) {
  if (!rawToken) {
    return;
  }
  const tokenHash = hashToken(rawToken);
  const existing = await RefreshToken.findOne({ tokenHash });
  if (existing && !existing.revokedAt) {
    existing.revokedAt = new Date();
    await existing.save();
  }
}

async function getMe(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  return toPublicUser(user);
}

module.exports = {
  toPublicUser,
  registerCustomer,
  registerVendor,
  login,
  rotateRefreshToken,
  logout,
  getMe,
  issueAuthSession,
};
