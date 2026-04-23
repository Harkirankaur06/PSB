const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const User = require("../models/User");
const Session = require("../models/Session");
const { startSession } = require("../modules/cyber/sessionTracker");

const {
  generateAccessToken,
  generateRefreshToken,verifyRefreshToken
} = require("../utils/token.util");

function shouldAutoVerifySecondFactor(user) {
  const hasPin = Boolean(user?.security?.pinHash);
  const hasWebAuthn = (user?.security?.webAuthnCredentials || []).length > 0;
  return !hasPin && !hasWebAuthn;
}

function getDeviceName(deviceName) {
  return deviceName || "Unknown Device";
}

async function signup(data, deviceName) {
  const { name, email, password, duressPassword } = data;

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new Error("User already exists");

  const passwordHash = await bcrypt.hash(password, 10);
  const duressPasswordHash = duressPassword
    ? await bcrypt.hash(duressPassword, 10)
    : undefined;

  const deviceId = uuidv4();

  const user = await User.create({
    name,
    email,
    passwordHash,
    security: duressPasswordHash
      ? {
          duressPasswordHash,
          duressConfiguredAt: new Date(),
        }
      : undefined,
    devices: [{ deviceId, deviceName, isTrusted: true }]
  });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await Session.create({
    userId: user._id,
    refreshToken,
    deviceId,
    lastActivityAt: new Date(),
    secondFactorVerified: true,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  startSession(String(user._id));

  return { user, accessToken, refreshToken, deviceId };
}

async function login(data, deviceName, knownDeviceId = null) {
  const { email, password } = data;

  const user = await User.findOne({ email });
  if (!user) throw new Error("Invalid credentials");

  const isPrimaryMatch = await bcrypt.compare(password, user.passwordHash);
  const isDuressMatch = user.security?.duressPasswordHash
    ? await bcrypt.compare(password, user.security.duressPasswordHash)
    : false;

  if (!isPrimaryMatch && !isDuressMatch) throw new Error("Invalid credentials");
  const accessMode = isDuressMatch ? "duress" : "normal";

  const matchedDevice = knownDeviceId
    ? user.devices.find((device) => device.deviceId === knownDeviceId)
    : null;
  const normalizedDeviceName = getDeviceName(deviceName);

  const deviceId = matchedDevice ? matchedDevice.deviceId : uuidv4();

  if (matchedDevice) {
    matchedDevice.deviceName = normalizedDeviceName;
    matchedDevice.lastUsed = new Date();

    if (matchedDevice.isTrusted) {
      user.trustScore = Math.min(100, (user.trustScore || 0) + 2);
    }
  } else {
    user.devices.push({
      deviceId,
      deviceName: normalizedDeviceName,
      isTrusted: false,
      lastUsed: new Date(),
    });
  }

  await user.save();

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await Session.create({
    userId: user._id,
    refreshToken,
    deviceId,
    lastActivityAt: new Date(),
    secondFactorVerified: shouldAutoVerifySecondFactor(user),
    accessMode,
    restrictedMode: isDuressMatch,
    fakeDashboardMode: isDuressMatch,
    delayedActions: isDuressMatch,
    silentAlertTriggered: isDuressMatch,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  startSession(String(user._id));

  return {
    user,
    accessToken,
    refreshToken,
    deviceId,
    isNewDevice: !matchedDevice,
    deviceName: normalizedDeviceName,
    accessMode,
    restrictedMode: isDuressMatch,
    fakeDashboardMode: isDuressMatch,
    delayedActions: isDuressMatch,
  };
}
async function logout(userId, refreshToken) {
  await Session.deleteOne({ userId, refreshToken });
}
async function refreshToken(oldRefreshToken) {

  const decoded = verifyRefreshToken(oldRefreshToken);

  const session = await Session.findOne({ refreshToken: oldRefreshToken });
  if (!session) throw new Error("Invalid session");

  const user = await User.findById(decoded.id);
  if (!user) throw new Error("User not found");

  // Rotate token
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  session.refreshToken = newRefreshToken;
  session.lastActivityAt = new Date();
  await session.save();

  return { newAccessToken, newRefreshToken };
}
module.exports = { signup, login ,logout,refreshToken};
