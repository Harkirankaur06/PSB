const {getTransactionHistory}= require("../services/transaction.service");
const transactionService = require("../services/transaction.service");

async function handleTransaction(req, res, forcedType) {
  try {
    const amount = req.body.amount;
    const deviceId = req.headers["x-device-id"];
    const type = forcedType || req.body.type;
    const metadata = req.body.metadata || {};

    const result = await transactionService.processTransaction({
      user: req.user,
      session: req.session,
      type,
      amount,
      deviceId,
      metadata,
      ipAddress: req.ip
    });

    res.json(result);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
async function getHistory(req, res) {
  try {
    const transactions = await transactionService.getTransactionHistory(req.user._id);
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
async function cancelTransaction(req, res) {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!transaction)
      return res.status(404).json({ message: "Not found" });

    if (transaction.status !== "warning")
      return res.status(400).json({ message: "Cannot cancel" });

    transaction.status = "cancelled";
    await transaction.save();

    res.json({ message: "Transaction cancelled" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
module.exports = { handleTransaction,getHistory,cancelTransaction };
