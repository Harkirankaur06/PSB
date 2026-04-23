const DummyBankDataset = require("../models/DummyBankDataset");
const UserBankConnection = require("../models/UserBankConnection");
const FinancialData = require("../models/FinancialData");
const Transaction = require("../models/Transaction");
const RiskLog = require("../models/RiskLog");
const Goal = require("../models/Goal");
const { Types } = require("mongoose");
const { calculateRisk } = require("../modules/cyber/cyber.service");
const securityService = require("./security.service");
const aiService = require("./ai.service");
const financialService = require("./financial.service");
const auditService = require("./audit.service");

function maskAccountNumber(accountNumber) {
  return `XXXXXX${String(accountNumber).slice(-4)}`;
}

function createSnapshotFromDataset(dataset) {
  return {
    monthlyIncome: dataset.profile?.monthlyIncome || 0,
    monthlyExpenses: dataset.profile?.monthlyExpenses || 0,
    savingsBalance: dataset.profile?.savingsBalance || 0,
    investmentValue: dataset.profile?.investmentValue || 0,
    assetValue: dataset.profile?.assetValue || 0,
  };
}

async function listAvailableBankDatasets() {
  const datasets = await DummyBankDataset.find({ active: true })
    .sort({ bankCode: 1 })
    .limit(3);

  return datasets.map((dataset) => ({
    id: String(dataset._id),
    bankCode: dataset.bankCode,
    bankName: dataset.bankName,
    displayName: dataset.displayName,
    description: dataset.description,
    holderName: dataset.holderName,
    accountType: dataset.accountType,
    ifsc: dataset.ifsc,
    accountNumberMasked: maskAccountNumber(dataset.accountNumber),
  }));
}

async function getUserBankConnections(userId) {
  const connections = await UserBankConnection.find({ userId })
    .populate("datasetId")
    .sort({ connectedAt: 1 });

  return connections
    .filter((connection) => connection.datasetId)
    .map((connection) => ({
      id: String(connection._id),
      alias: connection.alias || connection.datasetId.displayName,
      connectedAt: connection.connectedAt,
      isPrimary: connection.isPrimary,
      currentBalance:
        connection.accountSnapshot?.savingsBalance ??
        connection.datasetId.profile?.savingsBalance ??
        0,
      dataset: {
        id: String(connection.datasetId._id),
        bankCode: connection.datasetId.bankCode,
        bankName: connection.datasetId.bankName,
        displayName: connection.datasetId.displayName,
        description: connection.datasetId.description,
        holderName: connection.datasetId.holderName,
        accountType: connection.datasetId.accountType,
        ifsc: connection.datasetId.ifsc,
        accountNumberMasked: maskAccountNumber(connection.datasetId.accountNumber),
      },
    }));
}

async function syncUserBankData(userId) {
  const connections = await UserBankConnection.find({ userId }).populate("datasetId");
  const datasets = connections.map((connection) => connection.datasetId).filter(Boolean);

  const aggregate = datasets.reduce(
    (sum, dataset, index) => {
      const snapshot =
        connections[index]?.accountSnapshot || createSnapshotFromDataset(dataset);
      sum.income += snapshot.monthlyIncome || 0;
      sum.expenses += snapshot.monthlyExpenses || 0;
      sum.savings += snapshot.savingsBalance || 0;
      sum.investments += snapshot.investmentValue || 0;
      sum.assets += snapshot.assetValue || 0;
      return sum;
    },
    { income: 0, expenses: 0, savings: 0, investments: 0, assets: 0 }
  );

  await FinancialData.findOneAndUpdate(
    { userId },
    {
      userId,
      income: aggregate.income,
      expenses: aggregate.expenses,
      savings: aggregate.savings,
      investments: aggregate.investments,
      assets: aggregate.assets,
    },
    { new: true, upsert: true }
  );

  await Transaction.deleteMany({
    userId,
    "metadata.importSource": "dummy-bank-dataset",
  });

  const importedTransactions = datasets.flatMap((dataset) =>
    (dataset.transactions || []).map((transaction) => ({
      userId,
      type: transaction.type,
      amount: transaction.amount,
      status: transaction.status,
      riskScore: transaction.riskScore || 0,
      decision: transaction.decision || "allow",
      metadata: {
        ...(transaction.metadata || {}),
        importSource: "dummy-bank-dataset",
        sourceDatasetId: String(dataset._id),
        sourceBankCode: dataset.bankCode,
        sourceBankName: dataset.bankName,
        accountNumberMasked: maskAccountNumber(dataset.accountNumber),
        importedExternalId: transaction.externalId || null,
      },
      createdAt: transaction.bookedAt,
      updatedAt: transaction.bookedAt,
    }))
  );

  if (importedTransactions.length > 0) {
    await Transaction.insertMany(importedTransactions);
  }
}

async function connectBankDataset(userId, datasetId) {
  const dataset = await DummyBankDataset.findOne({ _id: datasetId, active: true });
  if (!dataset) {
    throw new Error("Selected bank dataset was not found.");
  }

  const existingConnections = await UserBankConnection.find({ userId });
  if (existingConnections.length >= 3) {
    throw new Error("You can connect up to 3 bank accounts.");
  }

  const alreadyConnected = existingConnections.some(
    (connection) => String(connection.datasetId) === String(datasetId)
  );
  if (alreadyConnected) {
    throw new Error("This dummy bank account is already connected.");
  }

  await UserBankConnection.create({
    userId,
    datasetId,
    alias: dataset.displayName,
    isPrimary: existingConnections.length === 0,
    accountSnapshot: createSnapshotFromDataset(dataset),
  });

  await syncUserBankData(userId);

  return getUserBankConnections(userId);
}

async function disconnectBankConnection(userId, connectionId) {
  const connection = await UserBankConnection.findOne({
    _id: connectionId,
    userId,
  });

  if (!connection) {
    throw new Error("Connected bank account not found.");
  }

  await UserBankConnection.deleteOne({ _id: connection._id });

  const remaining = await UserBankConnection.find({ userId }).sort({ connectedAt: 1 });
  if (remaining.length > 0 && !remaining.some((item) => item.isPrimary)) {
    remaining[0].isPrimary = true;
    await remaining[0].save();
  }

  await syncUserBankData(userId);
  return getUserBankConnections(userId);
}

async function getTransferPreview({
  user,
  session = null,
  deviceId = null,
  fromConnectionId,
  toConnectionId,
  amount,
}) {
  const transferAmount = Number(amount || 0);

  if (!transferAmount || transferAmount <= 0) {
    throw new Error("Transfer amount must be greater than zero.");
  }

  if (String(fromConnectionId) === String(toConnectionId)) {
    throw new Error("Choose two different accounts for internal transfer.");
  }

  const connections = await UserBankConnection.find({ userId: user._id }).populate("datasetId");
  const fromConnection = connections.find(
    (connection) => String(connection._id) === String(fromConnectionId)
  );
  const toConnection = connections.find(
    (connection) => String(connection._id) === String(toConnectionId)
  );

  if (!fromConnection || !toConnection) {
    throw new Error("Both source and destination accounts must be connected.");
  }

  const fromBalance =
    fromConnection.accountSnapshot?.savingsBalance ||
    fromConnection.datasetId?.profile?.savingsBalance ||
    0;
  const toBalance =
    toConnection.accountSnapshot?.savingsBalance ||
    toConnection.datasetId?.profile?.savingsBalance ||
    0;

  if (transferAmount > fromBalance) {
    throw new Error("Source account does not have enough available balance.");
  }

  const financialResult = await financialService.getFinancialWithGoals(user._id);
  const aiInsights = await aiService.generateInsights(user._id);
  const goals = financialResult.goals || [];
  const monthlySurplus = Math.max(
    0,
    (financialResult.financial?.income || 0) - (financialResult.financial?.expenses || 0)
  );
  const savingsImpactPercent =
    fromBalance > 0 ? Math.round((transferAmount / fromBalance) * 100) : 0;

  const syntheticTransaction = {
    _id: new Types.ObjectId(),
    amount: transferAmount,
    type: "transfer",
  };

  const riskResult = await calculateRisk({
    user,
    transaction: syntheticTransaction,
    deviceId,
    metadata: {
      beneficiaryId: String(toConnection._id),
      savedBeneficiaries: connections.map((connection) => String(connection._id)),
      location: toConnection.datasetId?.bankName || "Connected bank",
      lastLocation: fromConnection.datasetId?.bankName || "Primary bank",
    },
    accountBalance: fromBalance,
  });

  const goalImpact = goals.slice(0, 3).map((goal) => {
    const remaining = Math.max(0, (goal.targetAmount || 0) - (goal.currentAmount || 0));
    return {
      title: goal.title,
      remainingAmount: remaining,
      pressureLevel:
        transferAmount > monthlySurplus && remaining > 0 ? "elevated" : "stable",
    };
  });

  const wealthIntelligence = {
    sourceBalanceBefore: fromBalance,
    sourceBalanceAfter: fromBalance - transferAmount,
    destinationBalanceBefore: toBalance,
    destinationBalanceAfter: toBalance + transferAmount,
    monthlySurplus,
    savingsImpactPercent,
    headline: `This transfer will reduce the source account savings by ${savingsImpactPercent}% and move ${maskAccountNumber(
      fromConnection.datasetId.accountNumber
    )} liquidity into ${maskAccountNumber(toConnection.datasetId.accountNumber)}.`,
    aiRecommendation:
      aiInsights.recommendations?.[0] ||
      aiInsights.insights?.[0] ||
      "Review how this transfer affects near-term goals before approving it.",
    goalImpact,
  };

  let decision = "allow";
  if (riskResult.decision === "block") {
    decision = "block";
  } else if (riskResult.decision === "warn" || riskResult.riskScore >= 60) {
    decision = "warn";
  }

  return {
    fromAccount: {
      id: String(fromConnection._id),
      label: fromConnection.alias || fromConnection.datasetId.displayName,
      bankName: fromConnection.datasetId.bankName,
      accountNumberMasked: maskAccountNumber(fromConnection.datasetId.accountNumber),
      balance: fromBalance,
    },
    toAccount: {
      id: String(toConnection._id),
      label: toConnection.alias || toConnection.datasetId.displayName,
      bankName: toConnection.datasetId.bankName,
      accountNumberMasked: maskAccountNumber(toConnection.datasetId.accountNumber),
      balance: toBalance,
    },
    amount: transferAmount,
    wealthIntelligence,
    cyberProtection: {
      riskScore: riskResult.riskScore,
      riskLevel: riskResult.riskLevel,
      reasons: riskResult.reasons,
      signals: riskResult.signals,
    },
    decision,
  };
}

async function executeInternalTransfer({
  user,
  session = null,
  deviceId = null,
  ipAddress = null,
  data,
}) {
  const preview = await getTransferPreview({
    user,
    session,
    deviceId,
    fromConnectionId: data.fromConnectionId,
    toConnectionId: data.toConnectionId,
    amount: data.amount,
  });

  const amount = Number(data.amount || 0);
  const transferRecord = await Transaction.create({
    userId: user._id,
    type: "transfer",
    amount,
    status: "pending",
    metadata: {
      category: "Internal Transfer",
      direction: "debit",
      name: `Internal transfer to ${preview.toAccount.label}`,
      sourceConnectionId: data.fromConnectionId,
      destinationConnectionId: data.toConnectionId,
      sourceAccountMasked: preview.fromAccount.accountNumberMasked,
      destinationAccountMasked: preview.toAccount.accountNumberMasked,
      wealthIntelligence: preview.wealthIntelligence,
    },
  });

  const authorization = await securityService.evaluateTransactionAuthorization({
    userId: user._id,
    amount,
    accountAmount: preview.fromAccount.balance,
    type: "transfer",
    pin: data.pin,
    otp: data.otp,
    otpVerified: false,
    biometricVerified: false,
    session,
  });

  const finalDecision = !authorization.allowed
    ? "block"
    : preview.decision === "allow"
      ? "allow"
      : "warn";

  transferRecord.riskScore = preview.cyberProtection.riskScore;
  transferRecord.decision = finalDecision === "allow" ? "allow" : finalDecision === "warn" ? "warn" : "block";
  transferRecord.metadata = {
    ...(transferRecord.metadata || {}),
    cyberProtection: preview.cyberProtection,
    authorization: {
      allowed: authorization.allowed,
      reason: authorization.reason || null,
      authMode: authorization.authMode || null,
    },
  };

  if (finalDecision !== "allow") {
    transferRecord.status = finalDecision === "warn" ? "warning" : "blocked";
    await transferRecord.save();

    await RiskLog.create({
      userId: user._id,
      action: "internal_transfer",
      riskScore: preview.cyberProtection.riskScore,
      decision: finalDecision,
      reason: [
        ...preview.cyberProtection.reasons,
        authorization.reason || "Transfer held by internal protection layer.",
      ]
        .filter(Boolean)
        .join(" | "),
    });

    await auditService.logAction({
      userId: user._id,
      action: "INTERNAL_TRANSFER_HELD",
      ipAddress,
      deviceId,
      metadata: {
        amount,
        decision: finalDecision,
        riskScore: preview.cyberProtection.riskScore,
        source: preview.fromAccount.accountNumberMasked,
        destination: preview.toAccount.accountNumberMasked,
      },
    });

    return {
      executed: false,
      decision: finalDecision,
      preview,
      transaction: transferRecord,
    };
  }

  const connections = await UserBankConnection.find({ userId: user._id }).populate("datasetId");
  const fromConnection = connections.find(
    (connection) => String(connection._id) === String(data.fromConnectionId)
  );
  const toConnection = connections.find(
    (connection) => String(connection._id) === String(data.toConnectionId)
  );

  fromConnection.accountSnapshot.savingsBalance = Math.max(
    0,
    (fromConnection.accountSnapshot?.savingsBalance || 0) - amount
  );
  toConnection.accountSnapshot.savingsBalance =
    (toConnection.accountSnapshot?.savingsBalance || 0) + amount;

  await fromConnection.save();
  await toConnection.save();

  transferRecord.status = "completed";
  await transferRecord.save();

  await Transaction.create({
    userId: user._id,
    type: "transfer",
    amount,
    status: "completed",
    decision: "allow",
    riskScore: Math.max(5, Math.round(preview.cyberProtection.riskScore * 0.35)),
    metadata: {
      category: "Internal Transfer",
      direction: "credit",
      name: `Internal transfer from ${preview.fromAccount.label}`,
      sourceConnectionId: data.fromConnectionId,
      destinationConnectionId: data.toConnectionId,
      sourceAccountMasked: preview.fromAccount.accountNumberMasked,
      destinationAccountMasked: preview.toAccount.accountNumberMasked,
      mirroredFromTransactionId: String(transferRecord._id),
    },
  });

  await RiskLog.create({
    userId: user._id,
    action: "internal_transfer",
    riskScore: preview.cyberProtection.riskScore,
    decision: "allow",
    reason: preview.cyberProtection.reasons.join(" | "),
  });

  await auditService.logAction({
    userId: user._id,
    action: "INTERNAL_TRANSFER_EXECUTED",
    ipAddress,
    deviceId,
    metadata: {
      amount,
      decision: "allow",
      riskScore: preview.cyberProtection.riskScore,
      source: preview.fromAccount.accountNumberMasked,
      destination: preview.toAccount.accountNumberMasked,
    },
  });

  await syncUserBankData(user._id);

  return {
    executed: true,
    decision: "allow",
    preview,
    transaction: transferRecord,
    connections: await getUserBankConnections(user._id),
  };
}

module.exports = {
  listAvailableBankDatasets,
  getUserBankConnections,
  connectBankDataset,
  disconnectBankConnection,
  syncUserBankData,
  getTransferPreview,
  executeInternalTransfer,
};
