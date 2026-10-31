const CATEGORY_STATUSES = Object.freeze({
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
});

const CATEGORY_STATUS_VALUES = Object.freeze(Object.values(CATEGORY_STATUSES));

/** Root = 0. Default max 2 → three UI levels (root / child / grandchild). */
const MAX_CATEGORY_DEPTH = Number(process.env.MAX_CATEGORY_DEPTH || 2);

module.exports = {
  CATEGORY_STATUSES,
  CATEGORY_STATUS_VALUES,
  MAX_CATEGORY_DEPTH,
};
