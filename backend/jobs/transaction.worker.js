const { Worker } = require("bullmq");
const connection = require("../config/redis");
const Transaction = require("../models/Transaction");

const worker = new Worker(
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

    console.log("Transaction auto-executed:", transactionId);
  },
  { connection }
);

module.exports = worker;