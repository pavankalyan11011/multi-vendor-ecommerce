const { getEnv } = require('../config/env');

function refreshCookieOptions() {
  const env = getEnv();
  return {
    httpOnly: true,
    secure: env.isProd,
    sameSite: env.isProd ? 'strict' : 'lax',
    path: '/api/v1/auth',
    maxAge: env.refreshTokenTtlMs,
  };
}

function clearRefreshCookieOptions() {
  const env = getEnv();
  return {
    httpOnly: true,
    secure: env.isProd,
    sameSite: env.isProd ? 'strict' : 'lax',
    path: '/api/v1/auth',
  };
}

function setRefreshCookie(res, rawToken) {
  const env = getEnv();
  res.cookie(env.cookieName, rawToken, refreshCookieOptions());
}

function clearRefreshCookie(res) {
  const env = getEnv();
  res.clearCookie(env.cookieName, clearRefreshCookieOptions());
}

module.exports = {
  setRefreshCookie,
  clearRefreshCookie,
  refreshCookieOptions,
};
