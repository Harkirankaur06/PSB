const bcrypt = require("bcrypt");
const User = require("../models/User");
const OtpToken = require("../models/OtpToken");
const emailService = require("./email.service");
const auditService = require("./audit.service");
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require("@simplewebauthn/server");

const DEFAULT_APP_ORIGIN = "http://localhost:3000";
const RP_NAME = "L.E.G.E.N.D.";

function getOriginConfig(originHeader) {
  const origin = originHeader || process.env.FRONTEND_ORIGIN || DEFAULT_APP_ORIGIN;
  const url = new URL(origin);

  return {
    origin: url.origin,
    rpID: url.hostname,
  };
}

async function getUser(userId) {
  return await User.findById(userId);
}

async function createPin(userId, pin, session = null) {
  const user = await getUser(userId);
  const hash = await bcrypt.hash(pin, 10);

  user.security.pinHash = hash;
  await user.save();

  if (session) {
    session.secondFactorVerified = true;
    await session.save();
  }

  return true;
}

async function setDuressPassword(userId, duressPassword) {
  if (!duressPassword || String(duressPassword).trim().length < 6) {
    throw new Error("Private access password must be at least 6 characters.");
  }

  const user = await getUser(userId);
  user.security.duressPasswordHash = await bcrypt.hash(duressPassword, 10);
  user.security.duressConfiguredAt = new Date();
  await user.save();

  return {
    configured: true,
    configuredAt: user.security.duressConfiguredAt,
  };
}

async function verifyPin(userId, pin, session = null) {
  const user = await getUser(userId);

  if (!user.security.pinHash) {
    return false;
  }

  const valid = await bcrypt.compare(pin, user.security.pinHash);

  if (valid && session) {
    session.secondFactorVerified = true;
    await session.save();
  }

  return valid;
}

async function enableBiometric(userId) {
  const user = await getUser(userId);
  user.security.biometricEnabled = true;
  await user.save();

  return true;
}

async function getSecurityStatus(userId, session = null) {
  const user = await getUser(userId);
  const hasPin = Boolean(user?.security?.pinHash);
  const hasBiometric =
    Boolean(user?.security?.biometricEnabled) &&
    (user?.security?.webAuthnCredentials || []).length > 0;

  const currentDevice = (user?.devices || []).find(
    (device) => device.deviceId === session?.deviceId
  );

  return {
    hasPin,
    hasBiometric,
    biometricEnabled: Boolean(user?.security?.biometricEnabled),
    hasWebAuthnCredentials: (user?.security?.webAuthnCredentials || []).length > 0,
    secondFactorVerified: Boolean(session?.secondFactorVerified),
    needsSetup: !hasPin && !hasBiometric,
    requiresVerification: (hasPin || hasBiometric) && !session?.secondFactorVerified,
    accessMode: session?.accessMode || "normal",
    restrictedMode: Boolean(session?.restrictedMode),
    fakeDashboardMode: Boolean(session?.fakeDashboardMode),
    delayedActions: Boolean(session?.delayedActions),
    hasDuressPassword: Boolean(user?.security?.duressPasswordHash),
    promptTrustDevice: Boolean(currentDevice) && !currentDevice.isTrusted,
    currentDevice: currentDevice
      ? {
          deviceId: currentDevice.deviceId,
          deviceName: currentDevice.deviceName || "Unknown Device",
          lastUsed: currentDevice.lastUsed,
          isTrusted: Boolean(currentDevice.isTrusted),
        }
      : null,
  };
}

async function activatePrivateSession(userId, session = null, ipAddress = null) {
  const user = await getUser(userId);

  if (!session) {
    throw new Error("Active session not found");
  }

  session.accessMode = "duress";
  session.restrictedMode = true;
  session.fakeDashboardMode = true;
  session.delayedActions = true;
  session.silentAlertTriggered = true;
  await session.save();

  await auditService.logAction({
    userId,
    action: "PRIVATE_SESSION_ACTIVATED",
    ipAddress,
    deviceId: session.deviceId,
    metadata: {
      accessMode: "duress",
    },
  });

  await emailService.sendDuressAlertEmail({
    email: user.email,
    deviceName:
      (user.devices || []).find((item) => item.deviceId === session.deviceId)?.deviceName ||
      "current device",
    reason: "private session activation",
  });

  return {
    accessMode: session.accessMode,
    restrictedMode: session.restrictedMode,
    fakeDashboardMode: session.fakeDashboardMode,
    delayedActions: session.delayedActions,
  };
}

async function trustCurrentDevice(userId, session = null) {
  const user = await getUser(userId);

  if (!session?.deviceId) {
    throw new Error("Current session device not found");
  }

  const device = (user.devices || []).find(
    (item) => item.deviceId === session.deviceId
  );

  if (!device) {
    throw new Error("Device not found on this account");
  }

  device.isTrusted = true;
  device.lastUsed = new Date();
  user.trustScore = Math.min(100, (user.trustScore || 0) + 3);
  await user.save();

  return {
    trusted: true,
    deviceId: device.deviceId,
    trustScore: user.trustScore,
  };
}

function generateOtpCode() {
  return `${Math.floor(100000 + Math.random() * 900000)}`;
}

async function sendDeviceOtp(userId, session = null, ipAddress = null) {
  const user = await getUser(userId);

  if (!session?.deviceId) {
    throw new Error("Current session device not found");
  }

  const device = (user.devices || []).find((item) => item.deviceId === session.deviceId);

  if (!device) {
    throw new Error("Device not found on this account");
  }

  const otp = generateOtpCode();
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await OtpToken.findOneAndUpdate(
    {
      userId,
      deviceId: session.deviceId,
      purpose: "new_device_login",
    },
    {
      userId,
      deviceId: session.deviceId,
      purpose: "new_device_login",
      otpHash,
      expiresAt,
      consumedAt: null,
      attempts: 0,
    },
    { upsert: true, new: true }
  );

  const emailResult = await emailService.sendOtpEmail({
    email: user.email,
    otp,
    deviceName: device.deviceName,
  });

  await auditService.logAction({
    userId,
    action: "OTP_SENT",
    ipAddress,
    deviceId: session.deviceId,
    metadata: {
      purpose: "new_device_login",
      deliveryMode: emailResult.mode,
    },
  });

  return {
    sent: true,
    expiresAt,
    deliveryMode: emailResult.mode,
  };
}

async function verifyDeviceOtp(userId, session = null, otp, ipAddress = null) {
  if (!session?.deviceId) {
    throw new Error("Current session device not found");
  }

  const record = await OtpToken.findOne({
    userId,
    deviceId: session.deviceId,
    purpose: "new_device_login",
  });

  if (!record) {
    throw new Error("No active OTP found");
  }

  if (record.consumedAt) {
    throw new Error("OTP has already been used");
  }

  if (record.expiresAt.getTime() < Date.now()) {
    throw new Error("OTP has expired");
  }

  record.attempts += 1;
  const valid = await bcrypt.compare(otp, record.otpHash);

  if (!valid) {
    await record.save();
    throw new Error("Invalid OTP");
  }

  record.consumedAt = new Date();
  await record.save();

  const trustResult = await trustCurrentDevice(userId, session);

  await auditService.logAction({
    userId,
    action: "OTP_VERIFIED",
    ipAddress,
    deviceId: session.deviceId,
    metadata: {
      purpose: "new_device_login",
    },
  });

  return {
    verified: true,
    trusted: true,
    trustScore: trustResult.trustScore,
  };
}

async function sendDuressResolutionOtp(userId, session = null, ipAddress = null) {
  const user = await getUser(userId);

  if (!session?.deviceId) {
    throw new Error("Current session device not found");
  }

  if (session.accessMode !== "duress" && !session.restrictedMode) {
    throw new Error("Protected session is not active");
  }

  const device = (user.devices || []).find((item) => item.deviceId === session.deviceId);
  const otp = generateOtpCode();
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await OtpToken.findOneAndUpdate(
    {
      userId,
      deviceId: session.deviceId,
      purpose: "duress_clearance",
    },
    {
      userId,
      deviceId: session.deviceId,
      purpose: "duress_clearance",
      otpHash,
      expiresAt,
      consumedAt: null,
      attempts: 0,
    },
    { upsert: true, new: true }
  );

  const emailResult = await emailService.sendOtpEmail({
    email: user.email,
    otp,
    deviceName: device?.deviceName || "current device",
  });

  await auditService.logAction({
    userId,
    action: "DURESS_RESOLUTION_OTP_SENT",
    ipAddress,
    deviceId: session.deviceId,
    metadata: {
      purpose: "duress_clearance",
      deliveryMode: emailResult.mode,
    },
  });

  return {
    sent: true,
    expiresAt,
    deliveryMode: emailResult.mode,
  };
}

async function resolvePrivateSession(
  userId,
  session = null,
  { duressPassword, pin, otp },
  ipAddress = null
) {
  const user = await getUser(userId);

  if (!session) {
    throw new Error("Active session not found");
  }

  if (session.accessMode !== "duress" && !session.restrictedMode) {
    throw new Error("Protected session is not active");
  }

  if (!user.security?.duressPasswordHash) {
    throw new Error("Private access password is not configured");
  }

  if (!duressPassword || !pin || !otp) {
    throw new Error("Private password, PIN, and OTP are required");
  }

  const duressPasswordValid = await bcrypt.compare(
    String(duressPassword),
    user.security.duressPasswordHash
  );

  if (!duressPasswordValid) {
    throw new Error("Private access password is incorrect");
  }

  const pinValid = await verifyPin(userId, String(pin));

  if (!pinValid) {
    throw new Error("PIN is incorrect");
  }

  const record = await OtpToken.findOne({
    userId,
    deviceId: session.deviceId,
    purpose: "duress_clearance",
  });

  if (!record) {
    throw new Error("Request an OTP before ending protected mode");
  }

  if (record.consumedAt) {
    throw new Error("OTP has already been used");
  }

  if (record.expiresAt.getTime() < Date.now()) {
    throw new Error("OTP has expired");
  }

  record.attempts += 1;
  const otpValid = await bcrypt.compare(String(otp), record.otpHash);

  if (!otpValid) {
    await record.save();
    throw new Error("Invalid OTP");
  }

  record.consumedAt = new Date();
  await record.save();

  session.accessMode = "normal";
  session.restrictedMode = false;
  session.fakeDashboardMode = false;
  session.delayedActions = false;
  session.silentAlertTriggered = false;
  session.secondFactorVerified = true;
  await session.save();

  await auditService.logAction({
    userId,
    action: "PRIVATE_SESSION_RESOLVED",
    ipAddress,
    deviceId: session.deviceId,
    metadata: {
      accessMode: "normal",
      authMode: "duress_password+pin+otp",
    },
  });

  return {
    resolved: true,
    accessMode: session.accessMode,
    restrictedMode: session.restrictedMode,
    fakeDashboardMode: session.fakeDashboardMode,
    delayedActions: session.delayedActions,
  };
}

async function generateBiometricRegistrationOptions(userId, session, originHeader) {
  const user = await getUser(userId);
  const { rpID } = getOriginConfig(originHeader);

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID,
    userName: user.email,
    userDisplayName: user.name,
    userID: user._id.toString(),
    attestationType: "none",
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      residentKey: "preferred",
      userVerification: "required",
    },
    excludeCredentials: (user.security.webAuthnCredentials || []).map((credential) => ({
      id: credential.credentialID,
      transports: credential.transports || [],
    })),
  });

  session.currentChallenge = options.challenge;
  session.currentChallengeType = "registration";
  await session.save();

  return options;
}

async function verifyBiometricRegistration(userId, session, originHeader, response) {
  const user = await getUser(userId);
  const { origin, rpID } = getOriginConfig(originHeader);

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge: session.currentChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
  });

  if (!verification.verified || !verification.registrationInfo) {
    return { verified: false };
  }

  const credential = verification.registrationInfo.credential;
  const credentialExists = (user.security.webAuthnCredentials || []).some(
    (item) => item.credentialID === credential.id
  );

  if (!credentialExists) {
    user.security.webAuthnCredentials.push({
      credentialID: credential.id,
      publicKey: Buffer.from(credential.publicKey),
      counter: credential.counter,
      transports: credential.transports || response.response.transports || [],
      deviceType: verification.registrationInfo.credentialDeviceType,
      backedUp: verification.registrationInfo.credentialBackedUp,
    });
  }

  user.security.biometricEnabled = true;
  await user.save();

  session.currentChallenge = null;
  session.currentChallengeType = null;
  session.secondFactorVerified = true;
  await session.save();

  return {
    verified: true,
    credentialID: credential.id,
  };
}

async function generateBiometricAuthenticationOptions(userId, session, originHeader) {
  const user = await getUser(userId);
  const { rpID } = getOriginConfig(originHeader);

  const credentials = user.security.webAuthnCredentials || [];

  if (credentials.length === 0) {
    throw new Error("No biometric credential registered");
  }

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: credentials.map((credential) => ({
      id: credential.credentialID,
      transports: credential.transports || [],
    })),
    userVerification: "required",
  });

  session.currentChallenge = options.challenge;
  session.currentChallengeType = "authentication";
  await session.save();

  return options;
}

async function verifyBiometricAuthentication(userId, session, originHeader, response) {
  const user = await getUser(userId);
  const { origin, rpID } = getOriginConfig(originHeader);
  const credentials = user.security.webAuthnCredentials || [];
  const dbCredential = credentials.find(
    (credential) => credential.credentialID === response.id
  );

  if (!dbCredential) {
    throw new Error("Biometric credential not recognized");
  }

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge: session.currentChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    credential: {
      id: dbCredential.credentialID,
      publicKey: new Uint8Array(dbCredential.publicKey.buffer, dbCredential.publicKey.byteOffset, dbCredential.publicKey.byteLength),
      counter: dbCredential.counter,
      transports: dbCredential.transports || [],
    },
  });

  if (!verification.verified) {
    return { verified: false };
  }

  dbCredential.counter = verification.authenticationInfo.newCounter;
  await user.save();

  session.currentChallenge = null;
  session.currentChallengeType = null;
  session.secondFactorVerified = true;
  await session.save();

  return {
    verified: true,
  };
}

async function evaluateTransactionAuthorization({
  userId,
  amount,
  accountAmount,
  pin,
  otpVerified = false,
  biometricVerified = false,
}) {
  const user = await getUser(userId);
  const thresholdAmount = accountAmount > 0 ? accountAmount * 0.2 : 0;
  const requiresStepUp = thresholdAmount > 0 && amount >= thresholdAmount;
  const biometricEnabled =
    Boolean(user?.security?.biometricEnabled) &&
    (user?.security?.webAuthnCredentials || []).length > 0;

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
    reason:
      "Transaction verification failed. Use device biometric for smaller transactions or PIN plus OTP for larger ones.",
  };
}

module.exports = {
  createPin,
  setDuressPassword,
  verifyPin,
  enableBiometric,
  getSecurityStatus,
  activatePrivateSession,
  trustCurrentDevice,
  sendDeviceOtp,
  verifyDeviceOtp,
  sendDuressResolutionOtp,
  resolvePrivateSession,
  generateBiometricRegistrationOptions,
  verifyBiometricRegistration,
  generateBiometricAuthenticationOptions,
  verifyBiometricAuthentication,
  evaluateTransactionAuthorization,
};
