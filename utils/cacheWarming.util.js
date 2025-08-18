const { redisClient } = require('../config/redis.config');
const cacheConfig = require('../config/cache.config');
const logger = require('../utils/logger');
const Member = require('../models/memberProfile');
const Event = require('../models/Events');
const Inventory = require('../models/ClubInventory');

const warmingConfig = [
  { 
    path: '/api/v1/club-inventory',
    model: Inventory,
    ttl: cacheConfig.TTL.LONG,
    query: {}
  },
  { 
    path: '/api/v1/event-management',
    model: Event,
    ttl: cacheConfig.TTL.MEDIUM,
    query: { status: 'active' }
  },
  { 
    path: '/api/v1/club-member',
    model: Member,
    ttl: cacheConfig.TTL.LONG,
    query: { active: true }
  }
];

const warmCache = async () => {
  if (!cacheConfig.WARMING_ENABLED) return;

  try {
    logger.info('Starting cache warming process...');
    
    for (const endpoint of warmingConfig) {
      try {
        const data = await endpoint.model.find(endpoint.query).lean().exec();
        await redisClient.setEx(
          endpoint.path,
          endpoint.ttl,
          JSON.stringify(data)
        );
        logger.info(`Cache warmed for ${endpoint.path}`);
      } catch (err) {
        logger.error(`Failed to warm cache for ${endpoint.path}:`, err);
      }
    }
    
    logger.info('Cache warming completed');
  } catch (err) {
    logger.error('Cache warming process failed:', err);
  }
};

const scheduleCacheWarming = () => {
  if (!cacheConfig.WARMING_ENABLED) return;

  // Initial warm-up after 10 seconds
  setTimeout(warmCache, 10000);
  
  // Periodic warm-up every 30 minutes
  setInterval(warmCache, 30 * 60 * 1000);
};

module.exports = {
  warmCache,
  scheduleCacheWarming
};