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

  if (!user.security.pinHash) {
    return false;
  }

  return bcrypt.compare(pin, user.security.pinHash);
}

async function enableBiometric(userId) {
  const user = await User.findById(userId);

  user.security.biometricEnabled = true;
  await user.save();

  return true;
}

async function evaluateTransactionAuthorization({
  userId,
  amount,
  accountAmount,
  pin,
  otpVerified = false,
  biometricVerified = false,
}) {
  const user = await User.findById(userId);
  const thresholdAmount = accountAmount > 0 ? accountAmount * 0.2 : 0;
  const requiresStepUp = thresholdAmount > 0 && amount >= thresholdAmount;
  const biometricEnabled = Boolean(user?.security?.biometricEnabled);

  if (requiresStepUp) {
    const pinValid = pin ? await verifyPin(userId, pin) : false;

    if (!pinValid || !otpVerified) {
      return {
        allowed: false,
        requiresStepUp: true,
        thresholdAmount,
        reason:
          "Large transactions of 20% or more of account balance require both PIN and OTP verification.",
      };
    }

    return {
      allowed: true,
      requiresStepUp: true,
      thresholdAmount,
      authMode: "pin+otp",
    };
  }

  if (biometricVerified) {
    if (!biometricEnabled) {
      return {
        allowed: false,
        requiresStepUp: false,
        thresholdAmount,
        reason: "Biometric verification is not enabled on this account.",
      };
    }

    return {
      allowed: true,
      requiresStepUp: false,
      thresholdAmount,
      authMode: "biometric",
    };
  }

  if (pin) {
    const pinValid = await verifyPin(userId, pin);

    if (pinValid) {
      return {
        allowed: true,
        requiresStepUp: false,
        thresholdAmount,
        authMode: "pin",
      };
    }
  }

  return {
    allowed: false,
    requiresStepUp: false,
    thresholdAmount,
    reason: "Transaction verification failed. Use biometric for smaller transactions or PIN plus OTP for larger ones.",
  };
}

module.exports = {
  createPin,
  verifyPin,
  enableBiometric,
  evaluateTransactionAuthorization,
};
