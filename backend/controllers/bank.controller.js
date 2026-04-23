const bankService = require("../services/bank.service");

async function getAccount(req, res) {
  try {
    const account = await bankService.getAccount(req.user._id);
    res.json(account);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getTransactions(req, res) {
  try {
    const limit = Number(req.query.limit || 20);
    const transactions = await bankService.getTransactions(req.user._id, limit);
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function createTransfer(req, res) {
  try {
    const result = await bankService.initiateTransfer({
      user: req.user,
      session: req.session,
      deviceId: req.headers["x-device-id"],
      ipAddress: req.ip,
      data: req.body,
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function verifyOtp(req, res) {
  try {
    const result = await bankService.verifyTransferOtp({
      userId: req.user._id,
      otp: req.body.otp,
      ipAddress: req.ip,
      deviceId: req.headers["x-device-id"],
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function getRiskScore(req, res) {
  try {
    const result = await bankService.getRiskScore(req.user._id, req.session);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function setFreeze(req, res) {
  try {
    const result = await bankService.setAccountFreeze({
      userId: req.user._id,
      frozen: Boolean(req.body.frozen),
      ipAddress: req.ip,
      deviceId: req.headers["x-device-id"],
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = {
  getAccount,
  getTransactions,
  createTransfer,
  verifyOtp,
  getRiskScore,
  setFreeze,
};
