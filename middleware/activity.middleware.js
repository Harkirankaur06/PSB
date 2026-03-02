const auditService = require("../services/audit.service");

async function activityLogger(req, res, next) {
  if (req.user) {
    await auditService.logAction({
      userId: req.user._id,
      action: `API_${req.method}_${req.originalUrl}`,
      ipAddress: req.ip,
      deviceId: req.headers["x-device-id"] || null
    });
  }
  next();
}

module.exports = activityLogger;