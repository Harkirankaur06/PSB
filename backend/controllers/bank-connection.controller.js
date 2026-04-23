const bankConnectionService = require("../services/bank-connection.service");

async function getCatalog(req, res) {
  try {
    const banks = await bankConnectionService.listAvailableBankDatasets();
    res.json(banks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getConnections(req, res) {
  try {
    const connections = await bankConnectionService.getUserBankConnections(req.user._id);
    res.json(connections);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function connectBank(req, res) {
  try {
    const result = await bankConnectionService.connectBankDataset(
      req.user._id,
      req.body.datasetId
    );
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function disconnectBank(req, res) {
  try {
    const result = await bankConnectionService.disconnectBankConnection(
      req.user._id,
      req.params.id
    );
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function previewInternalTransfer(req, res) {
  try {
    const result = await bankConnectionService.getTransferPreview({
      user: req.user,
      session: req.session,
      deviceId: req.headers["x-device-id"],
      fromConnectionId: req.body.fromConnectionId,
      toConnectionId: req.body.toConnectionId,
      amount: req.body.amount,
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function executeInternalTransfer(req, res) {
  try {
    const result = await bankConnectionService.executeInternalTransfer({
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

module.exports = {
  getCatalog,
  getConnections,
  connectBank,
  disconnectBank,
  previewInternalTransfer,
  executeInternalTransfer,
};
