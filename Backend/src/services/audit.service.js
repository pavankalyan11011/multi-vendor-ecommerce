const { AuditLog } = require('../models/AuditLog');

async function writeAuditLog(entry) {
  return AuditLog.create(entry);
}

module.exports = { writeAuditLog };
