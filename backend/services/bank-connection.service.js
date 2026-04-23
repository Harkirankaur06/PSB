const DummyBankDataset = require("../models/DummyBankDataset");
const UserBankConnection = require("../models/UserBankConnection");
const FinancialData = require("../models/FinancialData");
const Transaction = require("../models/Transaction");

function maskAccountNumber(accountNumber) {
  return `XXXXXX${String(accountNumber).slice(-4)}`;
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
    (sum, dataset) => {
      sum.income += dataset.profile?.monthlyIncome || 0;
      sum.expenses += dataset.profile?.monthlyExpenses || 0;
      sum.savings += dataset.profile?.savingsBalance || 0;
      sum.investments += dataset.profile?.investmentValue || 0;
      sum.assets += dataset.profile?.assetValue || 0;
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

module.exports = {
  listAvailableBankDatasets,
  getUserBankConnections,
  connectBankDataset,
  disconnectBankConnection,
  syncUserBankData,
};
