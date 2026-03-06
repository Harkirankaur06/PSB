const AuditLog = require("../models/AuditLog");

async function logAction({
  userId,
  action,
  ipAddress,
  deviceId,
  metadata
}) {
  await AuditLog.create({
    userId,
    action,
    ipAddress,
    deviceId,
    metadata
  });
}

module.exports = { logAction };