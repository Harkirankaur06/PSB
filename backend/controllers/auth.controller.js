const authService = require("../services/auth.service");
const auditService = require("../services/audit.service");
const emailService = require("../services/email.service");

async function signup(req, res) {
  try {
    const result = await authService.signup(req.body, req.headers["user-agent"]);
    req.auditActor = result.user;
    req.auditDeviceId = result.deviceId;
    req.skipImportantActionEmail = true;

    await emailService.sendImportantActionEmail({
      email: result.user.email,
      action: "Account created",
      summary: "Your L.E.G.E.N.D. account was created successfully.",
      details: [
        `IP: ${req.ip || "unknown"}`,
        result.deviceId ? `Device ID: ${result.deviceId}` : null,
      ].filter(Boolean),
    });

    res.status(201).json({
      message: "User created successfully",
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      deviceId: result.deviceId,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function login(req, res) {
  try {
    const result = await authService.login(
      req.body,
      req.headers["user-agent"],
      req.headers["x-device-id"] || null
    );

    if (result.isNewDevice) {
      await emailService.sendNewDeviceNotification({
        email: result.user.email,
        deviceName: result.deviceName,
      });
    }

    if (result.accessMode === "duress") {
      await emailService.sendDuressAlertEmail({
        email: result.user.email,
        deviceName: result.deviceName,
        reason: "private access password",
      });
    }

    if (!result.isNewDevice && result.accessMode !== "duress") {
      await emailService.sendImportantActionEmail({
        email: result.user.email,
        action: "Account login",
        summary: "Your account was signed in successfully.",
        details: [
          `IP: ${req.ip || "unknown"}`,
          result.deviceName ? `Device: ${result.deviceName}` : null,
          result.deviceId ? `Device ID: ${result.deviceId}` : null,
        ].filter(Boolean),
      });
    }

    req.auditActor = result.user;
    req.auditDeviceId = result.deviceId;
    req.skipImportantActionEmail = true;

    await auditService.logAction({
      userId: result.user._id,
      action: result.accessMode === "duress" ? "LOGIN_DURESS" : "LOGIN",
      ipAddress: req.ip,
      deviceId: result.deviceId,
      metadata: {
        accessMode: result.accessMode,
        restrictedMode: result.restrictedMode,
        fakeDashboardMode: result.fakeDashboardMode,
        delayedActions: result.delayedActions,
      },
    });

    res.json({
      message: "Login successful",
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      deviceId: result.deviceId,
      isNewDevice: result.isNewDevice,
      accessMode: result.accessMode,
      restrictedMode: result.restrictedMode,
      fakeDashboardMode: result.fakeDashboardMode,
      delayedActions: result.delayedActions,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function getProfile(req, res) {
  try {
    res.json({
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      trustScore: req.user.trustScore,
      devices: req.user.devices,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function logout(req, res) {
  try {
    const { refreshToken } = req.body;

    await authService.logout(req.user._id, refreshToken);

    await auditService.logAction({
      userId: req.user._id,
      action: "LOGOUT",
      ipAddress: req.ip,
      deviceId: req.headers["x-device-id"] || null,
    });

    req.skipImportantActionEmail = true;
    await emailService.sendImportantActionEmail({
      email: req.user.email,
      action: "Account logout",
      summary: "Your current session was logged out successfully.",
      details: [
        `IP: ${req.ip || "unknown"}`,
        req.headers["x-device-id"] ? `Device ID: ${req.headers["x-device-id"]}` : null,
      ].filter(Boolean),
    });

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { signup, login, getProfile, logout };
