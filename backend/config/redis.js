const { Redis } = require("ioredis");

const redisUrl = process.env.REDIS_URL;
const redisHost = process.env.REDIS_HOST;
const redisPort = Number(process.env.REDIS_PORT || 6379);
const redisPassword = process.env.REDIS_PASSWORD;

const redisConfigured = Boolean(redisUrl || redisHost);

let connection = null;

if (redisConfigured) {
  connection = redisUrl
    ? new Redis(redisUrl, {
        maxRetriesPerRequest: null,
      })
    : new Redis({
        host: redisHost,
        port: redisPort,
        password: redisPassword || undefined,
        maxRetriesPerRequest: null,
      });

  connection.on("connect", () => {
    console.log("Redis connected");
  });

  connection.on("error", (error) => {
    console.error("Redis connection error:", error.message);
  });
} else {
  console.log("Redis not configured. Background queue features are running in fallback mode.");
}

function isRedisEnabled() {
  return Boolean(connection);
}

module.exports = {
  connection,
  isRedisEnabled,
};
