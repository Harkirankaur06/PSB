const buckets = new Map();

function createRateLimiter({ windowMs, max, keyPrefix = "default" }) {
  return function rateLimit(req, res, next) {
    const bucketKey = `${keyPrefix}:${req.user?._id || req.ip}:${req.path}`;
    const now = Date.now();
    const current = buckets.get(bucketKey);

    if (!current || current.resetAt <= now) {
      buckets.set(bucketKey, {
        count: 1,
        resetAt: now + windowMs,
      });
      return next();
    }

    if (current.count >= max) {
      return res.status(429).json({
        error: "Too many requests. Please wait a moment before trying again.",
      });
    }

    current.count += 1;
    buckets.set(bucketKey, current);
    next();
  };
}

module.exports = {
  createRateLimiter,
};
