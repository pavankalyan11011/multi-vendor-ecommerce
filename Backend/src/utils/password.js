const bcrypt = require('bcryptjs');
const { getEnv } = require('../config/env');

async function hashPassword(plain) {
  return bcrypt.hash(plain, getEnv().bcryptRounds);
}

async function verifyPassword(plain, passwordHash) {
  if (!plain || !passwordHash) {
    return false;
  }
  return bcrypt.compare(plain, passwordHash);
}

module.exports = { hashPassword, verifyPassword };
