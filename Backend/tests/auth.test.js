const jwt = require('jsonwebtoken');
const {
  startTestApp,
  stopTestApp,
  clearDb,
  getApp,
  createUser,
  authHeader,
  extractRefreshCookie,
  request,
} = require('./helpers');
const { ROLES } = require('../src/constants/roles');
const { STATUSES } = require('../src/constants/statuses');
const { getEnv } = require('../src/config/env');
const { RefreshToken } = require('../src/models/RefreshToken');
const { hashToken } = require('../src/utils/tokens');

describe('Phase 2.1 Authentication & RBAC', () => {
  beforeAll(async () => {
    await startTestApp();
  });

  afterAll(async () => {
    await stopTestApp();
  });

  beforeEach(async () => {
    await clearDb();
  });

  test('customer registration succeeds', async () => {
    const res = await request(getApp())
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Alice Customer',
        email: 'alice@example.com',
        password: 'Password1',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe(ROLES.CUSTOMER);
    expect(res.body.data.user.status).toBe(STATUSES.ACTIVE);
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.user.email).toBe('alice@example.com');
  });

  test('vendor registration creates PENDING vendor', async () => {
    const res = await request(getApp())
      .post('/api/v1/auth/vendor-register')
      .send({
        fullName: 'Vince Vendor',
        email: 'vince@example.com',
        password: 'Password1',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe(ROLES.VENDOR);
    expect(res.body.data.user.status).toBe(STATUSES.PENDING);
  });

  test('duplicate email is rejected', async () => {
    await request(getApp()).post('/api/v1/auth/register').send({
      fullName: 'Alice',
      email: 'dup@example.com',
      password: 'Password1',
    });

    const res = await request(getApp()).post('/api/v1/auth/register').send({
      fullName: 'Alice 2',
      email: 'dup@example.com',
      password: 'Password1',
    });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE_EMAIL');
  });

  test('public registration cannot assign ADMIN role via body', async () => {
    const res = await request(getApp())
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Hacker',
        email: 'hacker@example.com',
        password: 'Password1',
        role: 'ADMIN',
        status: 'ACTIVE',
      });

    // .strict() schema rejects unknown keys
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('invalid login is rejected without user enumeration', async () => {
    await createUser({ email: 'known@example.com', password: 'Password1' });

    const badEmail = await request(getApp()).post('/api/v1/auth/login').send({
      email: 'missing@example.com',
      password: 'Password1',
    });
    const badPass = await request(getApp()).post('/api/v1/auth/login').send({
      email: 'known@example.com',
      password: 'WrongPass1',
    });

    expect(badEmail.status).toBe(401);
    expect(badPass.status).toBe(401);
    expect(badEmail.body.error.message).toBe(badPass.body.error.message);
    expect(badEmail.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  test('successful login returns access token and HttpOnly refresh cookie', async () => {
    await createUser({ email: 'login@example.com', password: 'Password1' });

    const res = await request(getApp()).post('/api/v1/auth/login').send({
      email: 'login@example.com',
      password: 'Password1',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.refreshToken).toBeUndefined();

    const cookie = extractRefreshCookie(res);
    expect(cookie).toBeTruthy();
    expect(cookie.toLowerCase()).toContain('httponly');

    const env = getEnv();
    const payload = jwt.verify(res.body.data.accessToken, env.jwtAccessSecret, {
      issuer: env.jwtIssuer,
      audience: env.jwtAudience,
    });
    expect(payload.role).toBe(ROLES.CUSTOMER);
  });

  test('JWT verification protects /auth/me', async () => {
    const user = await createUser({ email: 'me@example.com' });

    const ok = await request(getApp())
      .get('/api/v1/auth/me')
      .set('Authorization', authHeader(user));
    expect(ok.status).toBe(200);
    expect(ok.body.data.user.email).toBe('me@example.com');

    const missing = await request(getApp()).get('/api/v1/auth/me');
    expect(missing.status).toBe(401);
  });

  test('expired access token is rejected', async () => {
    const user = await createUser({ email: 'exp@example.com' });
    const env = getEnv();
    const now = Math.floor(Date.now() / 1000);
    const expired = jwt.sign(
      {
        sub: user._id.toString(),
        role: user.role,
        status: user.status,
        iat: now - 120,
        exp: now - 60,
      },
      env.jwtAccessSecret,
      {
        issuer: env.jwtIssuer,
        audience: env.jwtAudience,
      }
    );

    const res = await request(getApp())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${expired}`);

    expect(res.status).toBe(401);
    expect(['TOKEN_EXPIRED', 'INVALID_TOKEN']).toContain(res.body.error.code);
  });

  test('refresh rotates token and rejects replay', async () => {
    await createUser({ email: 'refresh@example.com', password: 'Password1' });

    const loginRes = await request(getApp()).post('/api/v1/auth/login').send({
      email: 'refresh@example.com',
      password: 'Password1',
    });
    const cookie = extractRefreshCookie(loginRes);
    expect(cookie).toBeTruthy();

    const refresh1 = await request(getApp())
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookie)
      .set('Origin', 'http://localhost:3000');

    expect(refresh1.status).toBe(200);
    expect(refresh1.body.data.accessToken).toBeTruthy();
    const newCookie = extractRefreshCookie(refresh1);
    expect(newCookie).toBeTruthy();

    const replay = await request(getApp())
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookie)
      .set('Origin', 'http://localhost:3000');

    expect(replay.status).toBe(401);
    expect(replay.body.error.code).toBe('REFRESH_TOKEN_REUSE');
  });

  test('logout revokes refresh token', async () => {
    await createUser({ email: 'logout@example.com', password: 'Password1' });

    const loginRes = await request(getApp()).post('/api/v1/auth/login').send({
      email: 'logout@example.com',
      password: 'Password1',
    });
    const cookie = extractRefreshCookie(loginRes);
    const raw = cookie.split(';')[0].split('=')[1];

    const logoutRes = await request(getApp())
      .post('/api/v1/auth/logout')
      .set('Cookie', cookie)
      .set('Origin', 'http://localhost:3000');

    expect(logoutRes.status).toBe(200);

    const stored = await RefreshToken.findOne({ tokenHash: hashToken(raw) });
    expect(stored.revokedAt).not.toBeNull();

    const refreshAfter = await request(getApp())
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookie)
      .set('Origin', 'http://localhost:3000');
    expect(refreshAfter.status).toBe(401);
  });

  test('customer cannot access vendor dashboard', async () => {
    const customer = await createUser({
      email: 'cust@example.com',
      role: ROLES.CUSTOMER,
    });

    const res = await request(getApp())
      .get('/api/v1/vendor/dashboard')
      .set('Authorization', authHeader(customer));

    expect(res.status).toBe(403);
  });

  test('vendor cannot access admin dashboard', async () => {
    const vendor = await createUser({
      email: 'vend@example.com',
      role: ROLES.VENDOR,
      status: STATUSES.ACTIVE,
    });

    const res = await request(getApp())
      .get('/api/v1/admin/dashboard')
      .set('Authorization', authHeader(vendor));

    expect(res.status).toBe(403);
  });

  test('pending vendor is blocked from vendor dashboard but can call /me', async () => {
    const pending = await createUser({
      email: 'pending@example.com',
      role: ROLES.VENDOR,
      status: STATUSES.PENDING,
      password: 'Password1',
    });

    const me = await request(getApp())
      .get('/api/v1/auth/me')
      .set('Authorization', authHeader(pending));
    expect(me.status).toBe(200);

    const dash = await request(getApp())
      .get('/api/v1/vendor/dashboard')
      .set('Authorization', authHeader(pending));
    expect(dash.status).toBe(403);
    expect(dash.body.error.code).toBe('VENDOR_NOT_APPROVED');
  });

  test('suspended account cannot login or use access token', async () => {
    const suspended = await createUser({
      email: 'sus@example.com',
      password: 'Password1',
      status: STATUSES.SUSPENDED,
    });

    const login = await request(getApp()).post('/api/v1/auth/login').send({
      email: 'sus@example.com',
      password: 'Password1',
    });
    expect(login.status).toBe(403);
    expect(login.body.error.code).toBe('ACCOUNT_SUSPENDED');

    const me = await request(getApp())
      .get('/api/v1/auth/me')
      .set('Authorization', authHeader(suspended));
    expect(me.status).toBe(403);
    expect(me.body.error.code).toBe('ACCOUNT_SUSPENDED');
  });

  test('approved vendor and admin can access their dashboards', async () => {
    const vendor = await createUser({
      email: 'okvendor@example.com',
      role: ROLES.VENDOR,
      status: STATUSES.ACTIVE,
    });
    const admin = await createUser({
      email: 'admin@example.com',
      role: ROLES.ADMIN,
      status: STATUSES.ACTIVE,
    });

    const v = await request(getApp())
      .get('/api/v1/vendor/dashboard')
      .set('Authorization', authHeader(vendor));
    expect(v.status).toBe(200);

    const a = await request(getApp())
      .get('/api/v1/admin/dashboard')
      .set('Authorization', authHeader(admin));
    expect(a.status).toBe(200);
  });
});
