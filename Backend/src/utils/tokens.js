const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { getEnv } = require('../config/env');

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

function generateRefreshToken() {
  return crypto.randomBytes(48).toString('hex');
}

function signAccessToken(user) {
  const env = getEnv();
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      status: user.status,
    },
    env.jwtAccessSecret,
    {
      expiresIn: env.accessTokenTtl,
      issuer: env.jwtIssuer,
      audience: env.jwtAudience,
    }
  );
}

function verifyAccessToken(token) {
  const env = getEnv();
  return jwt.verify(token, env.jwtAccessSecret, {
    issuer: env.jwtIssuer,
    audience: env.jwtAudience,
  });
}

function accessTokenExpiresInSeconds() {
  const ttl = getEnv().accessTokenTtl;
  if (typeof ttl === 'number') {
    return ttl;
  }
  const match = String(ttl).match(/^(\d+)([smhd])$/i);
  if (!match) {
    return 900;
  }
  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
  return value * multipliers[unit];
}

module.exports = {
  hashToken,
  generateRefreshToken,
  signAccessToken,
  verifyAccessToken,
  accessTokenExpiresInSeconds,
};
