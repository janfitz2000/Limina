const redis = require('./redisClient');

async function scheduleConditionalOrderCheck(orderId, timestamp) {
  await redis.zadd('order_checks', timestamp, orderId);
}

async function getDueOrderChecks(now = Date.now()) {
  const ids = await redis.zrangebyscore('order_checks', 0, now);
  if (ids.length) {
    await redis.zremrangebyscore('order_checks', 0, now);
  }
  return ids;
}

module.exports = {
  scheduleConditionalOrderCheck,
  getDueOrderChecks,
};
