const Transaction = require("../../models/Transaction");
const detectRiskSignals = require("./riskSignals");
const calculateRiskScore = require("./riskScoring");
const makeDecision = require("./decisionEngine");
const generateExplanation = require("./explanationEngine");
const { getSessionDuration } = require("./sessionTracker");
const { getAverageTransaction, updateProfile } = require("./userBehaviorProfile");
const { recordTransaction } = require("./transactionTracker");

function mapDecision(decision) {
  if (decision === "BLOCK") return "block";
  if (decision === "WARN") return "warn";
  return "allow";
}

async function calculateRisk({ user, transaction, deviceId, metadata = {}, accountBalance = 0 }) {
  const now = new Date();
  const knownDevices = (user.devices || []).map((device) => device.deviceId);
  const matchedDevice = (user.devices || []).find((device) => device.deviceId === deviceId);
  const recentTransactions = await Transaction.find({
    userId: user._id,
    _id: { $ne: transaction._id },
  })
    .sort({ createdAt: -1 })
    .limit(20);

  const recentCompletedTransactions = recentTransactions.filter(
    (item) => item.status === "completed" || item.status === "warning"
  );

  const dbAverageAmount =
    recentCompletedTransactions.length > 0
      ? recentCompletedTransactions.reduce((sum, item) => sum + (item.amount || 0), 0) /
        recentCompletedTransactions.length
      : 0;

  const profileAverageAmount = getAverageTransaction(String(user._id));
  const avgAmount = profileAverageAmount || dbAverageAmount || transaction.amount || 0;

  const transactionCountLastMinute = recentTransactions.filter((item) => {
    const createdAt = new Date(item.createdAt).getTime();
    return now.getTime() - createdAt <= 60000;
  }).length;

  const rawSignals = detectRiskSignals({
    deviceId,
    knownDevices,
    amount: transaction.amount || 0,
    avgAmount,
    loginTime:
      getSessionDuration(String(user._id)) > 0
        ? new Date(now.getTime() - getSessionDuration(String(user._id)) * 1000)
        : null,
    transactionTime: now,
    otpRetries: metadata.otpRetries || 0,
    isFirstTimeAction: recentTransactions.length === 0,
    transactionsLastMinute: transactionCountLastMinute,
    beneficiaryId: metadata.beneficiaryId,
    savedBeneficiaries: metadata.savedBeneficiaries || [],
    location: metadata.location,
    lastLocation: metadata.lastLocation,
    accountBalance,
  });

  const signals = [...rawSignals];

  if (matchedDevice && matchedDevice.isTrusted === false) {
    signals.push("NEW_DEVICE");
  }

  const riskResult = calculateRiskScore(signals, {
    avgAmount,
    amount: transaction.amount || 0,
  });

  let adjustedRiskScore = riskResult.riskScore;

  if (!deviceId) {
    adjustedRiskScore += 5;
  }

  if (user.trustScore < 50) {
    adjustedRiskScore += 20;
  } else if (user.trustScore < 70) {
    adjustedRiskScore += 10;
  }

  const adjustedRiskLevel =
    adjustedRiskScore > 80 ? "HIGH" : adjustedRiskScore > 40 ? "MEDIUM" : "LOW";

  const decisionData = makeDecision(
    {
      ...riskResult,
      riskScore: adjustedRiskScore,
      riskLevel: adjustedRiskLevel,
    },
    signals
  );

  const explanation = generateExplanation(signals, decisionData);

  recordTransaction(String(user._id));

  if (decisionData.decision === "ALLOW") {
    updateProfile(String(user._id), transaction.amount || 0);
  }

  return {
    riskScore: decisionData.riskScore,
    riskLevel: decisionData.riskLevel,
    decision: mapDecision(decisionData.decision),
    reasons: explanation.detailedReasons,
    explanation,
    signals,
    action: decisionData.action,
    coolingTime: decisionData.coolingTime,
    fraudFlag: decisionData.fraudFlag,
  };
}

module.exports = { calculateRisk };
