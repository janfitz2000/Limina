const redis = require('./redisClient');

async function cacheProductData(productId, data, ttlSeconds = 86400) {
  const key = `product:${productId}`;
  await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
}

async function getCachedProductData(productId) {
  const key = `product:${productId}`;
  const json = await redis.get(key);
  return json ? JSON.parse(json) : null;
}

module.exports = {
  cacheProductData,
  getCachedProductData,
};
