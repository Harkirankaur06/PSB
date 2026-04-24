const auditService = require("../services/audit.service");
const emailService = require("../services/email.service");

function getResolvedPath(req) {
  if (req.baseUrl && req.route?.path) {
    return `${req.baseUrl}${req.route.path}`;
  }

  return (req.originalUrl || req.url || "").split("?")[0];
}

function toAuditAction(req, resolvedPath) {
  return `API_${req.method}_${resolvedPath}`
    .replace(/[/:.-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toUpperCase();
}

function getImportantActionDescriptor(req, resolvedPath) {
  const routeKey = `${req.method.toUpperCase()} ${resolvedPath}`;
  const importantRoutes = {
    "POST /api/auth/signup": {
      action: "Account created",
      summary: "A new L.E.G.E.N.D. account was created with your email address.",
    },
    "POST /api/auth/login": {
      action: "Account login",
      summary: "Your account was signed in successfully.",
    },
    "POST /api/auth/logout": {
      action: "Account logout",
      summary: "Your current session was signed out successfully.",
    },
    "POST /api/security/create-pin": {
      action: "PIN created",
      summary: "A new security PIN was configured on your account.",
    },
    "POST /api/security/duress-password": {
      action: "Private password updated",
      summary: "Your private password for protected mode was saved or updated.",
    },
    "POST /api/security/enable-biometric": {
      action: "Biometric login enabled",
      summary: "Biometric sign-in was enabled on your account.",
    },
    "POST /api/security/otp/verify": {
      action: "New device verified",
      summary: "A new device was verified and marked as trusted on your account.",
    },
    "POST /api/security/duress-resolution/resolve": {
      action: "Protected mode resolved",
      summary: "Protected mode was cleared and the session returned to normal mode.",
    },
    "POST /api/security/webauthn/register/verify": {
      action: "Biometric registration completed",
      summary: "A biometric credential was registered on your account.",
    },
    "POST /api/security/webauthn/authenticate/verify": {
      action: "Biometric sign-in verified",
      summary: "A biometric verification was completed successfully.",
    },
    "POST /api/bank-link/connections": {
      action: "Bank account linked",
      summary: "A bank connection was added to your account.",
    },
    "DELETE /api/bank-link/connections/:id": {
      action: "Bank account disconnected",
      summary: "A linked bank connection was removed from your account.",
    },
    "POST /api/bank-link/internal-transfer/execute": {
      action: "Internal transfer executed",
      summary: "An internal bank transfer was executed from your account.",
    },
    "POST /api/bank/transfer": {
      action: "External transfer created",
      summary: "An external transfer request was created from your account.",
    },
    "POST /api/bank/verify-otp": {
      action: "External transfer verified",
      summary: "An external transfer OTP was verified successfully.",
    },
    "POST /api/bank/freeze": {
      action: "Bank access freeze updated",
      summary: "The freeze state for your banking access was changed.",
    },
    "POST /api/transaction": {
      action: "Transaction submitted",
      summary: "A transaction was submitted from your account.",
    },
    "POST /api/transaction/transfer": {
      action: "Transfer submitted",
      summary: "A transfer transaction was submitted from your account.",
    },
    "POST /api/transaction/sip": {
      action: "SIP submitted",
      summary: "A SIP transaction was submitted from your account.",
    },
    "POST /api/transaction/invest": {
      action: "Investment submitted",
      summary: "An investment transaction was submitted from your account.",
    },
    "POST /api/transaction/:id/cancel": {
      action: "Transaction cancelled",
      summary: "A pending transaction was cancelled from your account.",
    },
    "POST /api/financial": {
      action: "Financial profile updated",
      summary: "Your financial profile information was updated.",
    },
    "PUT /api/financial": {
      action: "Financial profile updated",
      summary: "Your financial profile information was updated.",
    },
    "POST /api/goals": {
      action: "Goal created",
      summary: "A new financial goal was created on your account.",
    },
    "PUT /api/goals/:id": {
      action: "Goal updated",
      summary: "A financial goal was updated on your account.",
    },
    "DELETE /api/goals/:id": {
      action: "Goal deleted",
      summary: "A financial goal was deleted from your account.",
    },
  };

  return importantRoutes[routeKey] || null;
}

function getEmailDetails(req, res, resolvedPath) {
  return [
    `Route: ${req.method.toUpperCase()} ${resolvedPath}`,
    `Status: ${res.statusCode}`,
    `IP: ${req.ip || "unknown"}`,
    req.headers["x-device-id"] ? `Device ID: ${req.headers["x-device-id"]}` : null,
  ];
}

function activityLogger(req, res, next) {
  res.on("finish", async () => {
    if (res.statusCode >= 400) {
      return;
    }

    const actor = req.user || req.auditActor || null;
    const resolvedPath = getResolvedPath(req);

    if (!actor?._id) {
      return;
    }

    try {
      await auditService.logAction({
        userId: actor._id,
        action: toAuditAction(req, resolvedPath),
        ipAddress: req.ip,
        deviceId: req.headers["x-device-id"] || req.auditDeviceId || null,
        metadata: {
          method: req.method.toUpperCase(),
          path: resolvedPath,
          statusCode: res.statusCode,
        },
      });

      const importantAction = getImportantActionDescriptor(req, resolvedPath);

      if (!importantAction || req.skipImportantActionEmail || !actor.email) {
        return;
      }

      await emailService.sendImportantActionEmail({
        email: actor.email,
        action: importantAction.action,
        summary: importantAction.summary,
        details: getEmailDetails(req, res, resolvedPath),
      });
    } catch (err) {
      console.error("Activity logging failed:", err);
    }
  });

  next();
}

module.exports = activityLogger;
