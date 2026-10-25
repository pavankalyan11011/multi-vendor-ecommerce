const authService = require('../services/auth.service');
const { setRefreshCookie, clearRefreshCookie } = require('../utils/cookies');
const { getEnv } = require('../config/env');
const { asyncHandler } = require('../utils/asyncHandler');

function requestMeta(req) {
  return {
    userAgent: req.get('user-agent') || null,
    ip: req.ip,
  };
}

function readRefreshCookie(req) {
  return req.cookies?.[getEnv().cookieName];
}

const register = asyncHandler(async (req, res) => {
  const user = await authService.registerCustomer(req.body);
  res.status(201).json({ success: true, data: { user } });
});

const vendorRegister = asyncHandler(async (req, res) => {
  const user = await authService.registerVendor(req.body);
  res.status(201).json({
    success: true,
    data: {
      user,
      message: 'Vendor account created and pending approval',
    },
  });
});

const login = asyncHandler(async (req, res) => {
  const session = await authService.login(req.body, requestMeta(req));
  setRefreshCookie(res, session.refreshToken);
  res.json({
    success: true,
    data: {
      accessToken: session.accessToken,
      expiresIn: session.expiresIn,
      tokenType: 'Bearer',
      user: session.user,
    },
  });
});

const refresh = asyncHandler(async (req, res) => {
  const raw = readRefreshCookie(req);
  const session = await authService.rotateRefreshToken(raw, requestMeta(req));
  setRefreshCookie(res, session.refreshToken);
  res.json({
    success: true,
    data: {
      accessToken: session.accessToken,
      expiresIn: session.expiresIn,
      tokenType: 'Bearer',
      user: session.user,
    },
  });
});

const logout = asyncHandler(async (req, res) => {
  const raw = readRefreshCookie(req);
  await authService.logout(raw);
  clearRefreshCookie(res);
  res.json({ success: true, data: { message: 'Logged out' } });
});

const me = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.auth.userId);
  res.json({ success: true, data: { user } });
});

module.exports = {
  register,
  vendorRegister,
  login,
  refresh,
  logout,
  me,
};
