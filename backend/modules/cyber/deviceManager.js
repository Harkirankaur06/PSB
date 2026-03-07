const trustedDevices = new Map(); // userId -> deviceId

function checkDevice(userId, deviceId) {
  const storedDevice = trustedDevices.get(userId);

  if (!storedDevice) {
    trustedDevices.set(userId, deviceId);
    return { isTrusted: true, isNewDevice: false };
  }

  if (storedDevice !== deviceId) {
    return { isTrusted: false, isNewDevice: true };
  }

  return { isTrusted: true, isNewDevice: false };
}

module.exports = { checkDevice };