const Transaction = require("../models/Transaction");
const RiskLog = require("../models/RiskLog");
const { calculateRisk } = require("../modules/cyber/cyber.service");
const auditService = require("./audit.service");
const financialService = require("./financial.service");
const securityService = require("./security.service");

async function processTransaction({
  user,
  type,
  amount,
  deviceId,
  metadata = {},
  ipAddress = null,
}) {
  const financial = await financialService.getFinancialData(user._id);
  const accountAmount = financial.savings || 0;
  const securityMetadata = metadata.security || {};

  const transaction = await Transaction.create({
    userId: user._id,
    type,
    amount,
    status: "pending",
    metadata,
  });

  const {
    riskScore,
    riskLevel,
    decision,
    reasons,
    explanation,
    signals,
    action,
    coolingTime,
    fraudFlag,
  } = await calculateRisk({
    user,
    transaction,
    deviceId,
    metadata,
    accountBalance: accountAmount,
  });

  const authorizationCheck = await securityService.evaluateTransactionAuthorization({
    userId: user._id,
    amount,
    accountAmount,
    pin: securityMetadata.pin,
    otpVerified: Boolean(securityMetadata.otpVerified),
    biometricVerified: Boolean(securityMetadata.biometricVerified),
  });

  let finalRiskScore = riskScore;
  let finalRiskLevel = riskLevel;
  let finalDecision = decision;
  let finalReasons = [...reasons];
  let finalExplanation = explanation;
  let finalSignals = [...signals];
  let finalAction = action;
  let finalCoolingTime = coolingTime;
  let finalFraudFlag = fraudFlag;

  if (!authorizationCheck.allowed) {
    finalRiskScore = Math.max(finalRiskScore, authorizationCheck.requiresStepUp ? 95 : 75);
    finalRiskLevel = authorizationCheck.requiresStepUp ? "HIGH" : "MEDIUM";
    finalDecision = "block";
    finalFraudFlag = authorizationCheck.requiresStepUp;
    finalAction = "REQUIRE_TRANSACTION_VERIFICATION";
    finalCoolingTime = 0;
    finalSignals = [
      ...new Set([
        ...finalSignals,
        "SECURITY_VERIFICATION_REQUIRED",
        ...(authorizationCheck.requiresStepUp ? ["LARGE_TRANSACTION_AUTH_REQUIRED"] : []),
      ]),
    ];
    finalReasons = [...finalReasons, authorizationCheck.reason];
    finalExplanation = {
      summary: authorizationCheck.reason,
      detailedReasons: finalReasons,
    };
  }

  transaction.riskScore = finalRiskScore;
  transaction.decision = finalDecision;
  transaction.metadata = {
    ...(transaction.metadata || {}),
    cyberAnalysis: {
      riskLevel: finalRiskLevel,
      signals: finalSignals,
      action: finalAction,
      coolingTime: finalCoolingTime,
      fraudFlag: finalFraudFlag,
      summary: finalExplanation.summary,
      reasons: finalReasons,
      thresholdAmount: authorizationCheck.thresholdAmount,
      authMode: authorizationCheck.authMode || null,
    },
  };

  if (finalDecision === "allow") {
    transaction.status = "completed";
  }

  if (finalDecision === "block") {
    transaction.status = "blocked";
  }

  const transactionQueue = require("../jobs/transaction.queue");

  if (finalDecision === "warn") {
    transaction.status = "warning";

    await transactionQueue.add(
      "delayedTransaction",
      { transactionId: transaction._id },
      { delay: 10 * 60 * 1000 }
    );
  }

  await transaction.save();

  await auditService.logAction({
    userId: user._id,
    action: `TRANSACTION_${type.toUpperCase()}`,
    ipAddress,
    deviceId,
    metadata: {
      amount,
      decision: finalDecision,
      riskScore: finalRiskScore,
      riskLevel: finalRiskLevel,
      signals: finalSignals,
      thresholdAmount: authorizationCheck.thresholdAmount,
      authMode: authorizationCheck.authMode || null,
    },
  });

  await RiskLog.create({
    userId: user._id,
    action: type,
    riskScore: finalRiskScore,
    decision: finalDecision,
    reason: [finalExplanation.summary, ...finalReasons].join(" | "),
  });

  if (finalDecision === "block") {
    const penalty = finalSignals.includes("UNLIKELY_TIME_EXTREME_TRANSACTION") ? 20 : 10;
    user.trustScore = Math.max(0, user.trustScore - penalty);
  }

  if (finalDecision === "allow") {
    user.trustScore = Math.min(100, user.trustScore + 1);
  }

  await user.save();

  return {
    transaction,
    riskScore: finalRiskScore,
    riskLevel: finalRiskLevel,
    decision: finalDecision,
    reasons: finalReasons,
    explanation: finalExplanation,
    signals: finalSignals,
  };
}

async function getTransactionHistory(userId, limit = null) {
  const query = Transaction.find({ userId }).sort({ createdAt: -1 });

  if (limit) {
    query.limit(limit);
  }

  return await query;
}

module.exports = { processTransaction, getTransactionHistory };
