const bcrypt = require("bcrypt");
const User = require("../models/User");

async function createPin(userId, pin) {

  const user = await User.findById(userId);

  const hash = await bcrypt.hash(pin, 10);

  user.security.pinHash = hash;

  await user.save();

  return true;
}

async function verifyPin(userId, pin) {

  const user = await User.findById(userId);

  if (!user.security.pinHash) return false;

  return bcrypt.compare(pin, user.security.pinHash);
}

async function enableBiometric(userId) {

  const user = await User.findById(userId);

  user.security.biometricEnabled = true;

  await user.save();

  return true;
}

module.exports = {
  createPin,
  verifyPin,
  enableBiometric
};