const { Queue } = require("bullmq");
const { connection, isRedisEnabled } = require("../config/redis");

const transactionQueue = isRedisEnabled()
  ? new Queue("transactionQueue", {
      connection,
    })
  : null;

module.exports = transactionQueue;
