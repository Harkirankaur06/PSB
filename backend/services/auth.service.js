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

async function signup(data, deviceName) {
  const { name, email, password } = data;

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new Error("User already exists");

  const passwordHash = await bcrypt.hash(password, 10);

  const deviceId = uuidv4();

  const user = await User.create({
    name,
    email,
    passwordHash,
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

async function login(data, deviceName) {
  const { email, password } = data;

  const user = await User.findOne({ email });
  if (!user) throw new Error("Invalid credentials");

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) throw new Error("Invalid credentials");

  const deviceId = uuidv4();

  user.devices.push({
    deviceId,
    deviceName,
    isTrusted: false
  });

  await user.save();

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await Session.create({
    userId: user._id,
    refreshToken,
    deviceId,
    lastActivityAt: new Date(),
    secondFactorVerified: shouldAutoVerifySecondFactor(user),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  startSession(String(user._id));

  return { user, accessToken, refreshToken, deviceId };
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
