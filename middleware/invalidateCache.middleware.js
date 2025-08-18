const { redisClient } = require('../config/redis.config');
const logger = require('../utils/logger');

const invalidateCache = (patterns) => {
  return async (req, res, next) => {
    const originalJson = res.json;
    const originalSend = res.send;

    res.json = async function(body) {
      await performInvalidation();
      originalJson.call(this, body);
    };

    res.send = async function(body) {
      await performInvalidation();
      originalSend.call(this, body);
    };

    async function performInvalidation() {
      if (!cacheConfig.ENABLED || res.statusCode < 200 || res.statusCode >= 300) {
        return;
      }

      try {
        let invalidationPatterns = patterns;
        if (typeof patterns === 'function') {
          invalidationPatterns = patterns(req);
        }

        if (Array.isArray(invalidationPatterns)) {
          const keysToDelete = [];
          
          for (const pattern of invalidationPatterns) {
            if (pattern.includes('*')) {
              const keys = await redisClient.keys(pattern.replace(/\*/g, '.*'));
              keysToDelete.push(...keys);
            } else {
              keysToDelete.push(pattern);
            }
          }

          if (keysToDelete.length > 0) {
            await redisClient.del(keysToDelete);
            logger.info(`Invalidated cache keys: ${keysToDelete.join(', ')}`);
          }
        }
      } catch (err) {
        logger.error('Cache invalidation error:', err);
      }
    }

    next();
  };
};

module.exports = invalidateCache;