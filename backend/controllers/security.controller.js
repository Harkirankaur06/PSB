const securityService = require("../services/security.service");

async function createPin(req, res) {
  try {
    const userId = req.user._id;
    const { pin } = req.body;

    await securityService.createPin(userId, pin, req.session);
    res.json({ message: "PIN created" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function setDuressPassword(req, res) {
  try {
    const result = await securityService.setDuressPassword(
      req.user._id,
      req.body.duressPassword
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function verifyPin(req, res) {
  try {
    const userId = req.user._id;
    const { pin } = req.body;

    const valid = await securityService.verifyPin(userId, pin, req.session);
    res.json({ valid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function enableBiometric(req, res) {
  try {
    const userId = req.user._id;

    await securityService.enableBiometric(userId);
    res.json({ message: "Biometrics enabled" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getStatus(req, res) {
  try {
    const status = await securityService.getSecurityStatus(req.user._id, req.session);
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function activatePrivateSession(req, res) {
  try {
    const result = await securityService.activatePrivateSession(
      req.user._id,
      req.session,
      req.ip
    );
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function trustDevice(req, res) {
  try {
    const result = await securityService.trustCurrentDevice(req.user._id, req.session);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function sendOtp(req, res) {
  try {
    const result = await securityService.sendDeviceOtp(
      req.user._id,
      req.session,
      req.ip
    );
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function verifyOtp(req, res) {
  try {
    const result = await securityService.verifyDeviceOtp(
      req.user._id,
      req.session,
      req.body.otp,
      req.ip
    );
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function sendDuressResolutionOtp(req, res) {
  try {
    const result = await securityService.sendDuressResolutionOtp(
      req.user._id,
      req.session,
      req.ip
    );
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function sendTransactionOtp(req, res) {
  try {
    const result = await securityService.sendTransactionOtp(
      req.user._id,
      req.session,
      req.ip
    );
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function resolvePrivateSession(req, res) {
  try {
    const result = await securityService.resolvePrivateSession(
      req.user._id,
      req.session,
      req.body,
      req.ip
    );
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function getRegistrationOptions(req, res) {
  try {
    const options = await securityService.generateBiometricRegistrationOptions(
      req.user._id,
      req.session,
      req.headers.origin
    );

    res.json(options);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function verifyRegistration(req, res) {
  try {
    const result = await securityService.verifyBiometricRegistration(
      req.user._id,
      req.session,
      req.headers.origin,
      req.body
    );

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function getAuthenticationOptions(req, res) {
  try {
    const options = await securityService.generateBiometricAuthenticationOptions(
      req.user._id,
      req.session,
      req.headers.origin
    );

    res.json(options);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function verifyAuthentication(req, res) {
  try {
    const result = await securityService.verifyBiometricAuthentication(
      req.user._id,
      req.session,
      req.headers.origin,
      req.body
    );

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = {
  createPin,
  setDuressPassword,
  verifyPin,
  enableBiometric,
  getStatus,
  activatePrivateSession,
  trustDevice,
  sendOtp,
  verifyOtp,
  sendDuressResolutionOtp,
  sendTransactionOtp,
  resolvePrivateSession,
  getRegistrationOptions,
  verifyRegistration,
  getAuthenticationOptions,
  verifyAuthentication,
};
