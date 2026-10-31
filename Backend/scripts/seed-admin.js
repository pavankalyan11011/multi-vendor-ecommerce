/**
 * Provision a single ADMIN account (no public registration exists).
 *
 * Usage (from Backend/):
 *   set ADMIN_EMAIL=admin@example.com
 *   set ADMIN_PASSWORD=Password1
 *   set ADMIN_FULL_NAME=Platform Admin
 *   npm run seed:admin
 *
 * Requires MONGODB_URI and (for hashing) uses BCRYPT_ROUNDS from env / defaults.
 */
require('dotenv').config();

const { connectDB } = require('../src/config/db');
const { getEnv } = require('../src/config/env');
const { User } = require('../src/models/User');
const { ROLES } = require('../src/constants/roles');
const { STATUSES } = require('../src/constants/statuses');
const { hashPassword } = require('../src/utils/password');

async function main() {
  getEnv(); // validate JWT secrets / Mongo URI are present

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
    if (existing.role === ROLES.ADMIN) {
      existing.status = STATUSES.ACTIVE;
      existing.passwordHash = await hashPassword(password);
      existing.fullName = fullName;
      await existing.save();
      console.log(`Updated existing ADMIN: ${email}`);
    } else {
      throw new Error(
        `User ${email} already exists with role ${existing.role}. Choose another email.`
      );
    }
  } else {
    await User.create({
      fullName,
      email,
      passwordHash: await hashPassword(password),
      role: ROLES.ADMIN,
      status: STATUSES.ACTIVE,
      emailVerified: true,
    });
    console.log(`Created ADMIN: ${email}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
