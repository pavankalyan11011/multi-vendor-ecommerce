const ROLES = Object.freeze({
  CUSTOMER: 'CUSTOMER',
  VENDOR: 'VENDOR',
  ADMIN: 'ADMIN',
});

const ROLE_VALUES = Object.freeze(Object.values(ROLES));

/** Privilege order for deriving a single primary `role` (JWT / legacy). */
const ROLE_RANK = Object.freeze({
  [ROLES.CUSTOMER]: 1,
  [ROLES.VENDOR]: 2,
  [ROLES.ADMIN]: 3,
});

/**
 * Normalize roles from a user document (supports legacy role-only rows).
 * @param {{ role?: string, roles?: string[] } | null | undefined} user
 * @returns {string[]}
 */
function normalizeRoles(user) {
  if (!user) return [];
  const set = new Set();
  if (Array.isArray(user.roles)) {
    for (const r of user.roles) {
      if (ROLE_VALUES.includes(r)) set.add(r);
    }
  }
  if (user.role && ROLE_VALUES.includes(user.role)) {
    set.add(user.role);
  }
  return [...set];
}

function userHasRole(user, role) {
  return normalizeRoles(user).includes(role);
}

function userHasAnyRole(user, roles) {
  const owned = new Set(normalizeRoles(user));
  return roles.some((r) => owned.has(r));
}

function pickPrimaryRole(roles) {
  const list = Array.isArray(roles) ? roles : [];
  let best = ROLES.CUSTOMER;
  let bestRank = -1;
  for (const r of list) {
    const rank = ROLE_RANK[r] ?? -1;
    if (rank > bestRank) {
      best = r;
      bestRank = rank;
    }
  }
  return best;
}

/**
 * Ensure roles[] is populated and role (primary) stays in sync.
 * Mutates the mongoose doc / plain object in place.
 */
function syncUserRoles(user, nextRoles) {
  const roles = normalizeRoles({
    role: user.role,
    roles: nextRoles !== undefined ? nextRoles : user.roles,
  });
  if (roles.length === 0) {
    roles.push(ROLES.CUSTOMER);
  }
  user.roles = roles;
  user.role = pickPrimaryRole(roles);
  return user;
}

function addRole(user, role) {
  if (!ROLE_VALUES.includes(role)) {
    throw new Error(`Invalid role: ${role}`);
  }
  const roles = normalizeRoles(user);
  if (!roles.includes(role)) roles.push(role);
  return syncUserRoles(user, roles);
}

module.exports = {
  ROLES,
  ROLE_VALUES,
  ROLE_RANK,
  normalizeRoles,
  userHasRole,
  userHasAnyRole,
  pickPrimaryRole,
  syncUserRoles,
  addRole,
};
