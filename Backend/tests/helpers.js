const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');
const { resetEnvCache } = require('../src/config/env');
const { User } = require('../src/models/User');
const { hashPassword } = require('../src/utils/password');
const { ROLES } = require('../src/constants/roles');
const { STATUSES } = require('../src/constants/statuses');
const { signAccessToken } = require('../src/utils/tokens');

let mongo;
let app;

async function startTestApp() {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  resetEnvCache();

  // Jest + mongodb>=7.6 handshake workaround (missing client metadata `driver`)
  await mongoose.connect(process.env.MONGODB_URI, {
    runtimeAdapters: { os: require('os') },
  });
  // eslint-disable-next-line global-require
  const createApp = require('../src/app');
  app = createApp();
  return app;
}

async function stopTestApp() {
  await mongoose.disconnect();
  if (mongo) {
    await mongo.stop();
  }
  resetEnvCache();
}

async function clearDb() {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}

function getApp() {
  return app;
}

function agent() {
  return request.agent(app);
}

async function createUser({
  fullName = 'Test User',
  email,
  password = 'Password1',
  role = ROLES.CUSTOMER,
  status = STATUSES.ACTIVE,
} = {}) {
  const passwordHash = await hashPassword(password);
  return User.create({
    fullName,
    email: email.toLowerCase(),
    passwordHash,
    role,
    status,
    emailVerified: false,
  });
}

function authHeader(user, overrides = {}) {
  const token = signAccessToken({
    _id: user._id,
    role: overrides.role || user.role,
    status: overrides.status || user.status,
  });
  return `Bearer ${token}`;
}

function extractRefreshCookie(res) {
  const cookies = res.headers['set-cookie'] || [];
  const refresh = cookies.find((c) => c.startsWith('refreshToken='));
  return refresh || null;
}

module.exports = {
  startTestApp,
  stopTestApp,
  clearDb,
  getApp,
  agent,
  createUser,
  authHeader,
  extractRefreshCookie,
  request,
};
