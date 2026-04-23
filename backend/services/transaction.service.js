const Transaction = require("../models/Transaction");
const RiskLog = require("../models/RiskLog");
const { calculateRisk } = require("../modules/cyber/cyber.service");
const auditService = require("./audit.service");
const financialService = require("./financial.service");
const securityService = require("./security.service");
const User = require("../models/User");
const Goal = require("../models/Goal");
const { generateSeededTransactions } = require("../mock/fakeBankData");

function getExecutionMode() {
  return process.env.LIVE_INVESTMENT_PROVIDER ? "live-ready" : "simulated";
}

async function applyCompletedTransactionEffects(transaction) {
  if (!transaction || transaction.status !== "completed") {
    return transaction;
  }

  if (transaction.metadata?.execution?.appliedAt) {
    return transaction;
  }

  const financial = await financialService.getFinancialData(transaction.userId);
  const amount = Number(transaction.amount || 0);
  const metadata = transaction.metadata || {};

  if (transaction.type === "transfer") {
    financial.savings = Math.max(0, (financial.savings || 0) - amount);
  }

  if (transaction.type === "invest" || transaction.type === "sip") {
    financial.savings = Math.max(0, (financial.savings || 0) - amount);
    financial.investments = (financial.investments || 0) + amount;

    if (metadata.goalId) {
      const goal = await Goal.findOne({
        _id: metadata.goalId,
        userId: transaction.userId,
      });

      if (goal) {
        goal.currentAmount = Math.min(
          goal.targetAmount,
          (goal.currentAmount || 0) + amount
        );
        if ((financial.income || 0) > 0) {
          const monthlySavings = Math.max(
            0,
            (financial.income || 0) - (financial.expenses || 0)
          );
          if (monthlySavings > 0) {
            const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);
            const monthsRequired = Math.ceil(remainingAmount / monthlySavings);
            const predictedCompletion = new Date();
            predictedCompletion.setMonth(predictedCompletion.getMonth() + monthsRequired);
            goal.predictedCompletion = predictedCompletion;
          }
        }
        goal.progressPercentage =
          goal.targetAmount > 0 ? Number(((goal.currentAmount / goal.targetAmount) * 100).toFixed(2)) : 0;
        await goal.save();
      }
    }
  }

  if (transaction.type === "rebalance") {
    transaction.metadata = {
      ...metadata,
      rebalanceSummary:
        metadata.rebalanceSummary ||
        "Portfolio mix was rebalanced without changing total invested capital.",
    };
  }

  await financial.save();

  transaction.metadata = {
    ...transaction.metadata,
    execution: {
      mode: getExecutionMode(),
      appliedAt: new Date(),
    },
  };
  await transaction.save();

  return transaction;
}

async function processTransaction({
  user,
  session = null,
  type,
  amount,
  deviceId,
  metadata = {},
  ipAddress = null,
}) {
  const financial = await financialService.getFinancialData(user._id);
  const accountAmount = financial.savings || 0;
  const securityMetadata = metadata.security || {};
  const sanitizedMetadata = {
    ...metadata,
    security: metadata.security
      ? {
          otpVerified: Boolean(metadata.security.otpVerified),
          biometricVerified: Boolean(metadata.security.biometricVerified),
        }
      : undefined,
  };

  const transaction = await Transaction.create({
    userId: user._id,
    type,
    amount,
    status: "pending",
    metadata: sanitizedMetadata,
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
    metadata: sanitizedMetadata,
    accountBalance: accountAmount,
  });

  const authorizationCheck = await securityService.evaluateTransactionAuthorization({
    userId: user._id,
    amount,
    accountAmount,
    type,
    pin: securityMetadata.pin,
    otp: securityMetadata.otp,
    otpVerified: Boolean(securityMetadata.otpVerified),
    biometricVerified: Boolean(securityMetadata.biometricVerified),
    session,
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
  const duressModeActive =
    session?.accessMode === "duress" ||
    session?.restrictedMode ||
    metadata?.privateProtection === true;

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

  if (duressModeActive) {
    finalRiskScore = Math.max(finalRiskScore, 88);
    finalRiskLevel = "HIGH";
    finalDecision = "warn";
    finalFraudFlag = true;
    finalAction = "DELAY_AND_REVIEW";
    finalCoolingTime = Math.max(finalCoolingTime || 0, 30 * 60 * 1000);
    finalSignals = [...new Set([...finalSignals, "DURESS_MODE_ACTIVE", "SILENT_REVIEW_MODE"])];
    finalReasons = [
      ...finalReasons,
      "Private protection mode is active, so sensitive transactions are delayed for review.",
    ];
    finalExplanation = {
      summary: "Transaction pending verification under private protection mode.",
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
      duressMode: duressModeActive,
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
      { delay: duressModeActive ? 30 * 60 * 1000 : 10 * 60 * 1000 }
    );
  }

  await transaction.save();
  if (transaction.status === "completed") {
    await applyCompletedTransactionEffects(transaction);
  }

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
      executionMode: getExecutionMode(),
      duressMode: duressModeActive,
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

  const latestTransaction =
    transaction.status === "completed"
      ? await Transaction.findById(transaction._id)
      : transaction;

  return {
    transaction: latestTransaction,
    riskScore: finalRiskScore,
    riskLevel: finalRiskLevel,
    decision: finalDecision,
    reasons: finalReasons,
    explanation: finalExplanation,
    signals: finalSignals,
  };
}

async function getTransactionHistory(userId, limit = null) {
  const existingCount = await Transaction.countDocuments({ userId });

  if (existingCount === 0) {
    const user = await User.findById(userId);

    if (user) {
      const financial = await financialService.getFinancialData(userId);
      const seededTransactions = generateSeededTransactions({ user, financial });
      await Transaction.insertMany(seededTransactions);
    }
  }

  const query = Transaction.find({ userId }).sort({ createdAt: -1 });

  if (limit) {
    query.limit(limit);
  }

  return await query;
}

module.exports = { processTransaction, getTransactionHistory, applyCompletedTransactionEffects };
