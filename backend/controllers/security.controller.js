const securityService = require("../services/security.service");

// async function createPin(req, res) {

//   const { userId, pin } = req.body;

//   await securityService.createPin(userId, pin);

//   res.json({ message: "PIN created" });
// }
async function createPin(req, res) {

  const userId = req.user._id;   // from auth middleware
  const { pin } = req.body;

  await securityService.createPin(userId, pin);

  res.json({ message: "PIN created" });
}
async function verifyPin(req, res) {

  const userId = req.user._id;
  const { pin } = req.body;

  const valid = await securityService.verifyPin(userId, pin);

  res.json({ valid });
}

async function enableBiometric(req, res) {

  const userId = req.user._id;

  await securityService.enableBiometric(userId);

  res.json({ message: "Biometrics enabled" });
}

module.exports = {
  createPin,
  verifyPin,
  enableBiometric
};
