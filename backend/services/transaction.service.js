const Transaction = require("../models/Transaction");
const RiskLog = require("../models/RiskLog");
const { calculateRisk } = require("../modules/cyber/cyber.service");

async function processTransaction({ user, type, amount, deviceId }) {

  // 1️⃣ Create pending transaction
  const transaction = await Transaction.create({
    userId: user._id,
    type,
    amount,
    status: "pending"
  });

  // 2️⃣ Run Cyber Risk Engine
  const { riskScore, decision, reasons } = calculateRisk({
    user,
    transaction,
    deviceId
  });

  // 3️⃣ Update transaction
  transaction.riskScore = riskScore;
  transaction.decision = decision;

  if (decision === "allow") transaction.status = "completed";
  if (decision === "block") transaction.status = "blocked";
  const transactionQueue = require("../jobs/transaction.queue");

if (decision === "warn") {
  transaction.status = "warning";

  await transactionQueue.add(
    "delayedTransaction",
    { transactionId: transaction._id },
    { delay: 10 * 60 * 1000 } // 10 minutes
  );
}

  await transaction.save();
  await auditService.logAction({
  userId: user._id,
  action: `TRANSACTION_${type.toUpperCase()}`,
  ipAddress: null,
  deviceId,
  metadata: {
    amount,
    decision
  }
});
  // 4️⃣ Log risk event
  await RiskLog.create({
    userId: user._id,
    action: type,
    riskScore,
    decision,
    reason: reasons.join(", ")
  });

  // 5️⃣ Update trust score
  if (decision === "block") user.trustScore -= 10;
  if (decision === "allow") user.trustScore += 1;

  await user.save();

  return {
    transaction,
    riskScore,
    decision,
    reasons
  };
}
async function getTransactionHistory(userId) {
  return await Transaction.find({ userId })
    .sort({ createdAt: -1 });
}

module.exports = { processTransaction ,getTransactionHistory};