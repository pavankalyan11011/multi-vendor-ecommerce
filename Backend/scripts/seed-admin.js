/**
 * Provision a single ADMIN account (no public registration exists).
 * Seeds roles: ADMIN + CUSTOMER so the same email can use Console and Shop.
 *
 * Usage (from Backend/):
 *   set ADMIN_EMAIL=admin@example.com
 *   set ADMIN_PASSWORD=Password1
 *   set ADMIN_FULL_NAME=Platform Admin
 *   npm run seed:admin
 */
require('dotenv').config();

const { connectDB } = require('../src/config/db');
const { getEnv } = require('../src/config/env');
const { User } = require('../src/models/User');
const { ROLES, userHasRole, addRole } = require('../src/constants/roles');
const { STATUSES } = require('../src/constants/statuses');
const { hashPassword } = require('../src/utils/password');

async function main() {
  getEnv();

  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';
  const fullName = (process.env.ADMIN_FULL_NAME || 'Platform Admin').trim();

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required');
  }
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    throw new Error(
      'ADMIN_PASSWORD must be at least 8 characters and include a letter and a number'
    );
  }

  await connectDB();

  const existing = await User.findOne({ email });
  if (existing) {
    if (!userHasRole(existing, ROLES.ADMIN) && existing.role !== ROLES.ADMIN) {
      throw new Error(
        `User ${email} already exists with roles ${JSON.stringify(
          existing.roles || [existing.role]
        )}. Choose another email.`
      );
    }
    existing.status = STATUSES.ACTIVE;
    existing.passwordHash = await hashPassword(password);
    existing.fullName = fullName;
    existing.emailVerified = true;
    addRole(existing, ROLES.ADMIN);
    addRole(existing, ROLES.CUSTOMER);
    await existing.save();
    console.log(`Updated existing ADMIN (+ CUSTOMER): ${email}`);
  } else {
    await User.create({
      fullName,
      email,
      passwordHash: await hashPassword(password),
      role: ROLES.ADMIN,
      roles: [ROLES.ADMIN, ROLES.CUSTOMER],
      status: STATUSES.ACTIVE,
      emailVerified: true,
    });
    console.log(`Created ADMIN (+ CUSTOMER): ${email}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
