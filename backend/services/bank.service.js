const bcrypt = require("bcrypt");
const { Types } = require("mongoose");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const FinancialData = require("../models/FinancialData");
const BankProfile = require("../models/BankProfile");
const auditService = require("./audit.service");
const emailService = require("./email.service");
const aiService = require("./ai.service");
const financialService = require("./financial.service");
const { calculateRisk } = require("../modules/cyber/cyber.service");
const {
  createSeededRandom,
  generateBankIdentity,
  generateFinancialSnapshot,
  generateSeededTransactions,
  randomInt,
  pick,
} = require("../mock/fakeBankData");

function maskAccountNumber(accountNumber) {
  return `XXXXXX${String(accountNumber).slice(-4)}`;
}

async function ensureUser(userId) {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

async function ensureFinancialSnapshot(user) {
  let financial = await FinancialData.findOne({ userId: user._id });

  if (!financial) {
    financial = await FinancialData.create(generateFinancialSnapshot(user));
  }

  return financial;
}

async function ensureTransactionSeed(user, financial) {
  const count = await Transaction.countDocuments({ userId: user._id });

  if (count > 0) {
    return;
  }

  const seededTransactions = generateSeededTransactions({ user, financial });
  await Transaction.insertMany(seededTransactions);
}

async function ensureBankProfile(user) {
  let profile = await BankProfile.findOne({ userId: user._id });

  if (!profile) {
    const identity = generateBankIdentity(user);
    profile = await BankProfile.create({
      userId: user._id,
      ...identity,
    });
  }

  return profile;
}

async function bootstrapBanking(userId) {
  const user = await ensureUser(userId);
  const profile = await ensureBankProfile(user);
  const financial = await ensureFinancialSnapshot(user);
  await ensureTransactionSeed(user, financial);

  return {
    user,
    profile,
    financial,
  };
}

function buildAccountResponse(profile, financial, user) {
  return {
    holderName: user.name,
    bankName: profile.bankName,
    branchName: profile.branchName,
    accountType: profile.accountType,
    ifsc: profile.ifsc,
    accountNumber: maskAccountNumber(profile.accountNumber),
    status: profile.status,
    balances: {
      available: financial.savings || 0,
      current: financial.savings || 0,
      invested: financial.investments || 0,
      assets: financial.assets || 0,
    },
  };
}

function buildTransactionResponse(transaction) {
  return {
    id: String(transaction._id),
    type: transaction.type,
    amount: transaction.amount,
    status: transaction.status,
    riskScore: transaction.riskScore || 0,
    decision: transaction.decision || "allow",
    createdAt: transaction.createdAt,
    metadata: {
      ...transaction.metadata,
      beneficiaryAccount: transaction.metadata?.beneficiaryAccount
        ? maskAccountNumber(transaction.metadata.beneficiaryAccount)
        : undefined,
    },
  };
}

function buildRiskSummary(transactions, profile, session) {
  const recent = transactions.slice(0, 12);
  const highValue = recent.filter((tx) => tx.amount >= 25000).length;
  const suspicious = recent.filter((tx) => (tx.riskScore || 0) >= 65).length;
  const blocked = recent.filter((tx) => tx.status === "blocked").length;
  const warning = recent.filter((tx) => tx.status === "warning").length;

  let riskScore = 22 + highValue * 8 + suspicious * 10 + blocked * 12 + warning * 6;
  if (profile.status === "frozen") riskScore += 15;
  if (session?.restrictedMode || session?.accessMode === "duress") riskScore += 18;
  riskScore = Math.min(99, riskScore);

  const alerts = [];
  if (profile.status === "frozen") alerts.push("Account is currently frozen.");
  if (blocked > 0) alerts.push(`${blocked} recent transactions were blocked.`);
  if (warning > 0) alerts.push(`${warning} transactions are under warning or review.`);
  if (highValue > 1) alerts.push("Multiple high-value transactions were detected recently.");
  if (suspicious > 0) alerts.push("Suspicious transaction scores crossed the preferred threshold.");

  return {
    riskScore,
    spendingPattern: highValue > 2 || suspicious > 2 ? "irregular" : "stable",
    alerts,
  };
}

async function getAccount(userId) {
  const { user, profile, financial } = await bootstrapBanking(userId);
  return buildAccountResponse(profile, financial, user);
}

async function getTransactions(userId, limit = 20) {
  await bootstrapBanking(userId);
  const transactions = await Transaction.find({ userId }).sort({ createdAt: -1 }).limit(limit);
  return transactions.map(buildTransactionResponse);
}

async function getRiskScore(userId, session = null) {
  const { profile } = await bootstrapBanking(userId);
  const transactions = await Transaction.find({ userId }).sort({ createdAt: -1 }).limit(20);
  return buildRiskSummary(transactions, profile, session);
}

function computeTransferSignals({ amount, financial, seenBeneficiary, session, currentDeviceTrusted }) {
  const signals = [];
  let riskScore = 18;

  if (amount >= Math.max(25000, Math.round((financial.income || 0) * 0.35))) {
    signals.push("high-value-transfer");
    riskScore += 28;
  }

  const currentHour = new Date().getHours();
  if (currentHour < 6 || currentHour >= 23) {
    signals.push("late-night-activity");
    riskScore += 14;
  }

  if (!seenBeneficiary) {
    signals.push("new-beneficiary");
    riskScore += 18;
  }

  if (!currentDeviceTrusted) {
    signals.push("untrusted-device");
    riskScore += 16;
  }

  if (session?.restrictedMode || session?.accessMode === "duress") {
    signals.push("protected-mode-active");
    riskScore += 20;
  }

  return {
    riskScore: Math.min(99, riskScore),
    signals,
  };
}

function buildExternalTransferWeights({
  amount,
  averageTransferAmount,
  seenBeneficiary,
  currentDeviceTrusted,
  behaviorAnomalyScore = 0,
}) {
  const now = new Date();
  const isLateNight = now.getHours() < 6 || now.getHours() >= 23;
  const weights = [];

  if (!seenBeneficiary) {
    weights.push({
      label: "New recipient",
      points: 25,
      reason: "This beneficiary has not appeared in your prior transfer history.",
    });
  }

  if (amount >= Math.max(20000, averageTransferAmount * 3)) {
    weights.push({
      label: "High amount anomaly",
      points: 20,
      reason: "This amount is much higher than your usual transfer pattern.",
    });
  }

  if (isLateNight) {
    weights.push({
      label: "Late-night timing",
      points: 15,
      reason: "Transfers at this hour are less common and deserve extra review.",
    });
  }

  if (!currentDeviceTrusted) {
    weights.push({
      label: "Untrusted device",
      points: 15,
      reason: "This device is not marked as trusted for the account.",
    });
  }

  if (behaviorAnomalyScore >= 30) {
    weights.push({
      label: "Behavior anomaly",
      points: behaviorAnomalyScore >= 60 ? 18 : 10,
      reason: "Recent interaction patterns suggest elevated stress or unusual behavior.",
    });
  }

  const total = weights.reduce((sum, item) => sum + item.points, 0);
  const decision = total >= 60 ? "block" : total >= 35 ? "warn" : "allow";

  return {
    total,
    decision,
    isLateNight,
    weights,
  };
}

async function previewTransfer({
  user,
  session = null,
  deviceId = null,
  data,
}) {
  const { profile, financial } = await bootstrapBanking(user._id);

  if (profile.status === "frozen") {
    throw new Error("Account is frozen. Unfreeze it before creating a transfer.");
  }

  const amount = Number(data.amount || 0);
  if (!amount || amount <= 0) {
    throw new Error("Transfer amount must be greater than zero.");
  }

  if (amount > (financial.savings || 0)) {
    throw new Error("Insufficient available balance.");
  }

  const beneficiaryName = String(data.beneficiaryName || "").trim();
  const beneficiaryAccount = String(data.beneficiaryAccount || "").replace(/\D/g, "");
  const ifsc = String(data.ifsc || "").trim().toUpperCase();
  const bankName = String(data.bankName || "").trim();

  if (!beneficiaryName) {
    throw new Error("Account holder name is required.");
  }

  if (!beneficiaryAccount || beneficiaryAccount.length < 8) {
    throw new Error("Enter a valid beneficiary account number.");
  }

  if (!ifsc) {
    throw new Error("IFSC is required.");
  }

  if (!bankName) {
    throw new Error("Bank name is required.");
  }

  const previousTransfer = await Transaction.findOne({
    userId: user._id,
    type: "transfer",
    "metadata.beneficiaryAccount": beneficiaryAccount,
  });

  const previousTransfers = await Transaction.find({
    userId: user._id,
    type: "transfer",
    status: { $in: ["completed", "warning"] },
  })
    .sort({ createdAt: -1 })
    .limit(20);

  const averageTransferAmount =
    previousTransfers.length > 0
      ? previousTransfers.reduce((sum, item) => sum + (item.amount || 0), 0) / previousTransfers.length
      : 0;

  const currentDeviceTrusted = Boolean(
    (user.devices || []).find((item) => item.deviceId === deviceId)?.isTrusted
  );

  const weightSummary = buildExternalTransferWeights({
    amount,
    averageTransferAmount,
    seenBeneficiary: Boolean(previousTransfer),
    currentDeviceTrusted,
    behaviorAnomalyScore: Number(data.behaviorAnomalyScore || 0),
  });

  const syntheticTransaction = {
    _id: new Types.ObjectId(),
    amount,
    type: "transfer",
  };

  const riskResult = await calculateRisk({
    user,
    transaction: syntheticTransaction,
    deviceId,
    metadata: {
      beneficiaryId: beneficiaryAccount,
      savedBeneficiaries: previousTransfers
        .map((item) => item.metadata?.beneficiaryAccount)
        .filter(Boolean),
      location: bankName,
      lastLocation: previousTransfers[0]?.metadata?.location || "Known location",
      otpRetries: Number(data.otpRetries || 0),
    },
    accountBalance: financial.savings || 0,
  });

  const aiInsights = await aiService.generateInsights(user._id);
  const financialResult = await financialService.getFinancialWithGoals(user._id);
  const monthlySurplus = Math.max(
    0,
    (financialResult.financial?.income || 0) - (financialResult.financial?.expenses || 0)
  );
  const savingsImpactPercent =
    (financial.savings || 0) > 0 ? Math.round((amount / financial.savings) * 100) : 0;

  return {
    beneficiary: {
      beneficiaryName,
      beneficiaryAccountMasked: maskAccountNumber(beneficiaryAccount),
      ifsc,
      bankName,
      transferMode: data.channel || "NEFT",
      purpose: data.category || "Personal",
      note: data.note || "",
      isNewBeneficiary: !previousTransfer,
    },
    wealthIntelligence: {
      currentBalance: financial.savings || 0,
      projectedBalance: Math.max(0, (financial.savings || 0) - amount),
      monthlySurplus,
      savingsImpactPercent,
      goalImpact:
        amount > monthlySurplus
          ? "This transfer is larger than your current monthly surplus and may slow some goals."
          : "This transfer stays within your current monthly surplus comfort zone.",
      aiRecommendation:
        aiInsights.recommendations?.[0] ||
        aiInsights.insights?.[0] ||
        "Review the purpose and timing before confirming the transfer.",
    },
    cyberProtection: {
      riskScore: Math.max(riskResult.riskScore, weightSummary.total),
      decision:
        weightSummary.decision === "block" || riskResult.decision === "block"
          ? "block"
          : weightSummary.decision === "warn" || riskResult.decision === "warn"
            ? "warn"
            : "allow",
      reasons: riskResult.reasons,
      explainability: weightSummary.weights,
      signals: riskResult.signals,
      calmMessage:
        weightSummary.decision === "block" || riskResult.decision === "block"
          ? "This action looks unusual for your account, so we paused it to protect your funds."
          : weightSummary.decision === "warn" || riskResult.decision === "warn"
            ? "This action is unusual for your account. Please confirm again after a short review."
            : "This action fits your normal profile and can proceed with verification.",
      coolingOffSeconds:
        weightSummary.decision === "warn" || riskResult.decision === "warn" ? 30 : 0,
    },
  };
}

async function initiateTransfer({ user, session = null, deviceId = null, ipAddress = null, data }) {
  const { profile, financial } = await bootstrapBanking(user._id);

  if (profile.status === "frozen") {
    throw new Error("Account is frozen. Unfreeze it before creating a transfer.");
  }

  const amount = Number(data.amount || 0);
  if (!amount || amount <= 0) {
    throw new Error("Transfer amount must be greater than zero.");
  }

  if (amount > (financial.savings || 0)) {
    throw new Error("Insufficient available balance.");
  }

  const beneficiaryName = String(data.beneficiaryName || "Beneficiary").trim();
  const beneficiaryAccount = String(data.beneficiaryAccount || "").replace(/\D/g, "");
  const ifsc = String(data.ifsc || "").trim().toUpperCase();

  if (!beneficiaryAccount || beneficiaryAccount.length < 8) {
    throw new Error("Enter a valid beneficiary account number.");
  }

  if (!ifsc) {
    throw new Error("IFSC is required.");
  }

  const previousTransfer = await Transaction.findOne({
    userId: user._id,
    type: "transfer",
    "metadata.beneficiaryAccount": beneficiaryAccount,
  });

  const currentDeviceTrusted = Boolean(
    (user.devices || []).find((item) => item.deviceId === deviceId)?.isTrusted
  );
  const { riskScore, signals } = computeTransferSignals({
    amount,
    financial,
    seenBeneficiary: Boolean(previousTransfer),
    session,
    currentDeviceTrusted,
  });

  const requiresOtp = riskScore >= 45 || amount >= Math.max(15000, Math.round((financial.income || 0) * 0.2));
  const blocked = riskScore >= 88;
  const transaction = await Transaction.create({
    userId: user._id,
    type: "transfer",
    amount,
    status: blocked ? "blocked" : requiresOtp ? "pending" : "completed",
    decision: blocked ? "block" : "allow",
    riskScore,
    metadata: {
      category: data.category || "Transfer",
      beneficiaryName,
      beneficiaryAccount,
      beneficiaryAccountMasked: maskAccountNumber(beneficiaryAccount),
      ifsc,
      note: data.note || "",
      channel: data.channel || "NEFT",
      location: data.location || pick(createSeededRandom(`${user._id}-location-${Date.now()}`), ["Mumbai", "Delhi", "Bengaluru", "Pune"]),
      simulatedSignals: signals,
    },
  });

  if (blocked) {
    await auditService.logAction({
      userId: user._id,
      action: "BANK_TRANSFER_BLOCKED",
      ipAddress,
      deviceId,
      metadata: {
        amount,
        ifsc,
        riskScore,
        signals,
      },
    });

    return {
      transfer: buildTransactionResponse(transaction),
      requiresOtp: false,
      riskScore,
      alerts: ["Transfer blocked by the simulated fraud engine."],
    };
  }

  if (!requiresOtp) {
    financial.savings = Math.max(0, (financial.savings || 0) - amount);
    await financial.save();
  }

  if (requiresOtp) {
    const otp = `${randomInt(createSeededRandom(`${user._id}-${Date.now()}-otp`), 100000, 999999)}`;
    profile.simulatedOtpHash = await bcrypt.hash(otp, 10);
    profile.simulatedOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    profile.pendingTransfer = {
      transactionId: transaction._id,
      amount,
      beneficiaryName,
      beneficiaryAccount,
      ifsc,
    };
    await profile.save();

    await emailService.sendOtpEmail({
      email: user.email,
      otp,
      deviceName: "bank transfer approval",
    });
  }

  await auditService.logAction({
    userId: user._id,
    action: requiresOtp ? "BANK_TRANSFER_OTP_REQUIRED" : "BANK_TRANSFER_COMPLETED",
    ipAddress,
    deviceId,
    metadata: {
      amount,
      ifsc,
      riskScore,
      signals,
    },
  });

  return {
    transfer: buildTransactionResponse(transaction),
    requiresOtp,
    riskScore,
    alerts: signals.map((signal) => signal.replace(/-/g, " ")),
    otpSent: requiresOtp,
  };
}

async function verifyTransferOtp({ userId, otp, ipAddress = null, deviceId = null }) {
  const { financial, profile } = await bootstrapBanking(userId);

  if (!profile.pendingTransfer?.transactionId || !profile.simulatedOtpHash) {
    throw new Error("No pending OTP-protected transfer found.");
  }

  if (!otp) {
    throw new Error("OTP is required.");
  }

  if (!profile.simulatedOtpExpiresAt || profile.simulatedOtpExpiresAt.getTime() < Date.now()) {
    throw new Error("OTP has expired.");
  }

  const valid = await bcrypt.compare(String(otp), profile.simulatedOtpHash);
  if (!valid) {
    throw new Error("Invalid OTP.");
  }

  const transaction = await Transaction.findById(profile.pendingTransfer.transactionId);
  if (!transaction) {
    throw new Error("Pending transfer record not found.");
  }

  transaction.status = "completed";
  transaction.metadata = {
    ...(transaction.metadata || {}),
    otpVerifiedAt: new Date(),
  };
  await transaction.save();

  financial.savings = Math.max(0, (financial.savings || 0) - (profile.pendingTransfer.amount || 0));
  await financial.save();

  profile.simulatedOtpHash = null;
  profile.simulatedOtpExpiresAt = null;
  profile.pendingTransfer = null;
  await profile.save();

  await auditService.logAction({
    userId,
    action: "BANK_TRANSFER_OTP_VERIFIED",
    ipAddress,
    deviceId,
    metadata: {
      transactionId: transaction._id,
      amount: transaction.amount,
    },
  });

  return {
    verified: true,
    transfer: buildTransactionResponse(transaction),
  };
}

async function setAccountFreeze({ userId, frozen, ipAddress = null, deviceId = null }) {
  const { profile } = await bootstrapBanking(userId);
  profile.status = frozen ? "frozen" : "active";
  await profile.save();

  await auditService.logAction({
    userId,
    action: frozen ? "BANK_ACCOUNT_FROZEN" : "BANK_ACCOUNT_UNFROZEN",
    ipAddress,
    deviceId,
    metadata: {
      status: profile.status,
    },
  });

  return {
    status: profile.status,
  };
}

module.exports = {
  bootstrapBanking,
  getAccount,
  getTransactions,
  getRiskScore,
  previewTransfer,
  initiateTransfer,
  verifyTransferOtp,
  setAccountFreeze,
};
