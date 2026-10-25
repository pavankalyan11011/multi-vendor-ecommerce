const ROLES = Object.freeze({
  CUSTOMER: 'CUSTOMER',
  VENDOR: 'VENDOR',
  ADMIN: 'ADMIN',
});

const ROLE_VALUES = Object.freeze(Object.values(ROLES));

module.exports = { ROLES, ROLE_VALUES };
