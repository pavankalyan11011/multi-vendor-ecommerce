/**
 * Backfill User.roles from legacy User.role and grant ADMIN accounts CUSTOMER.
 *
 * Usage (from Backend/):
 *   node scripts/migrate-user-roles.js
 */
require('dotenv').config();

const { connectDB } = require('../src/config/db');
const { getEnv } = require('../src/config/env');
const { User } = require('../src/models/User');
const {
  ROLES,
  normalizeRoles,
  syncUserRoles,
  addRole,
  userHasRole,
} = require('../src/constants/roles');

async function main() {
  getEnv();
  await connectDB();

  const users = await User.find({});
  let updated = 0;

  for (const user of users) {
    const hadRolesArray =
      Array.isArray(user.roles) && user.roles.length > 0;
    syncUserRoles(user);
    if (userHasRole(user, ROLES.ADMIN)) {
      addRole(user, ROLES.CUSTOMER);
    }
    const after = JSON.stringify(normalizeRoles(user));
    const needsSave =
      !hadRolesArray ||
      user.isModified('roles') ||
      user.isModified('role');
    if (needsSave) {
      await user.save();
      updated += 1;
      console.log(`${user.email}: ${after}`);
    } else {
      console.log(`${user.email}: already ok ${after}`);
    }
  }

  console.log(`Migrated ${updated} / ${users.length} users`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
