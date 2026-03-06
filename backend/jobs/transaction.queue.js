const { Queue } = require("bullmq");
const connection = require("../config/redis");

const transactionQueue = new Queue("transactionQueue", {
  connection
});

module.exports = transactionQueue;