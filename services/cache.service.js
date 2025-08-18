const { redisClient } = require('../config/redis.config');
const cacheConfig = require('../config/cache.config');
const logger = require('../utils/logger');

const cacheStats = {
  hits: 0,
  misses: 0,
  errors: 0
};

const trackCacheStats = (req) => {
  if (req.cacheStats) {
    if (req.cacheStats.hit) {
      cacheStats.hits++;
    } else {
      cacheStats.misses++;
    }
  }
};

const getCacheStats = () => {
  return {
    ...cacheStats,
    hitRate: cacheStats.hits / (cacheStats.hits + cacheStats.misses) || 0
  };
};

const flushCache = async () => {
  try {
    await redisClient.flushAll();
    logger.info('Cache flushed successfully');
    return true;
  } catch (err) {
    logger.error('Error flushing cache:', err);
    return false;
  }
};

const getCacheKeys = async (pattern = '*') => {
  try {
    return await redisClient.keys(pattern);
  } catch (err) {
    logger.error('Error getting cache keys:', err);
    return [];
  }
};

const getCacheValue = async (key) => {
  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (err) {
    logger.error(`Error getting cache value for key ${key}:`, err);
    return null;
  }
};

module.exports = {
  trackCacheStats,
  getCacheStats,
  flushCache,
  getCacheKeys,
  getCacheValue
};