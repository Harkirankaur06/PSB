const { Worker } = require("bullmq");
const { connection, isRedisEnabled } = require("../config/redis");
const Transaction = require("../models/Transaction");
const { applyCompletedTransactionEffects } = require("../services/transaction.service");

const worker = isRedisEnabled()
  ? new Worker(
      "transactionQueue",
      async job => {
        const { transactionId } = job.data;

        const transaction = await Transaction.findById(transactionId);

        if (!transaction) return;

        if (transaction.status === "cancelled") {
          return;
        }

        transaction.status = "completed";
        await transaction.save();
        await applyCompletedTransactionEffects(transaction);

        console.log("Transaction auto-executed:", transactionId);
      },
      { connection }
    )
  : null;

module.exports = worker;
