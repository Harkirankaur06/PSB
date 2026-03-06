const authService = require("../services/auth.service");
const auditService = require("../services/audit.service");

async function signup(req, res) {
  try {
    const result = await authService.signup(req.body, req.headers["user-agent"]);

    res.status(201).json({
      message: "User created successfully",
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      deviceId: result.deviceId
    });

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function login(req, res) {
  try {
    const result = await authService.login(req.body, req.headers["user-agent"]);
     await auditService.logAction({
     userId: result.user._id,
     action: "LOGIN",
     ipAddress: req.ip,
     deviceId: result.deviceId
    });
    res.json({
      message: "Login successful",
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      deviceId: result.deviceId
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
      devices: req.user.devices
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
async function logout(req, res) {
  try {
    const { refreshToken } = req.body;

    // 1️⃣ Delete session
    await authService.logout(req.user._id, refreshToken);

    // 2️⃣ Log successful logout
    await auditService.logAction({
      userId: req.user._id,
      action: "LOGOUT",
      ipAddress: req.ip,
      deviceId: req.headers["x-device-id"] || null
    });

    // 3️⃣ Send response
    res.json({ message: "Logged out successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { signup, login ,getProfile,logout};