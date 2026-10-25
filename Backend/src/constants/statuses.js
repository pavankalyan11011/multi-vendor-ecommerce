const STATUSES = Object.freeze({
  ACTIVE: 'ACTIVE',
  PENDING: 'PENDING',
  SUSPENDED: 'SUSPENDED',
});

const STATUS_VALUES = Object.freeze(Object.values(STATUSES));

module.exports = { STATUSES, STATUS_VALUES };
