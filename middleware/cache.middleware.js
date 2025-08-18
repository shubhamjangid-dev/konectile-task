const { redisClient } = require('../config/redis.config');
const cacheConfig = require('../config/cache.config');
const logger = require('../utils/logger');

const cacheMiddleware = (options = {}) => {
  const { 
    ttl = cacheConfig.TTL.MEDIUM,
    prefix = cacheConfig.PREFIX,
    excludeParams = ['auth', 'token', 'api_key'],
    includeHeaders = false,
    bypassCache = false
  } = options;

  return async (req, res, next) => {
    if (!cacheConfig.ENABLED || bypassCache || req.method !== 'GET') {
      req.cacheBypassed = true;
      return next();
    }

    // Clean request parameters
    const cleanParams = { ...req.query };
    excludeParams.forEach(param => delete cleanParams[param]);

    // Create cache key
    let cacheKey = prefix + req.originalUrl.split('?')[0];
    if (Object.keys(cleanParams).length > 0) {
      cacheKey += '?' + new URLSearchParams(cleanParams).toString();
    }
    if (includeHeaders && req.headers.authorization) {
      cacheKey += ':auth:' + req.headers.authorization.split(' ')[1];
    }

    try {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        req.cacheHit = true;
        if (cacheConfig.STATS_ENABLED) req.cacheStats = { hit: true, key: cacheKey };
        return res.json(JSON.parse(cachedData));
      }

      req.cacheKey = cacheKey;
      req.cacheTTL = ttl;
      if (cacheConfig.STATS_ENABLED) req.cacheStats = { hit: false, key: cacheKey };
      next();
    } catch (err) {
      logger.error('Cache read error:', err);
      next();
    }
  };
};

module.exports = cacheMiddleware;