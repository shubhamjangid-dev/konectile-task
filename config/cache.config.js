module.exports = {
    TTL: {
      SHORT: parseInt(process.env.REDIS_TTL_SHORT) || 300,       // 5 minutes
      MEDIUM: parseInt(process.env.REDIS_TTL_MEDIUM) || 1800,    // 30 minutes
      LONG: parseInt(process.env.REDIS_TTL_LONG) || 3600,        // 1 hour
      VERY_LONG: parseInt(process.env.REDIS_TTL_VERY_LONG) || 86400  // 1 day
    },
    PREFIX: process.env.CACHE_PREFIX || 'cache:',
    ENABLED: process.env.CACHE_ENABLED === 'true',
    WARMING_ENABLED: process.env.CACHE_WARMING_ENABLED === 'true',
    STATS_ENABLED: process.env.CACHE_STATS_ENABLED === 'true'
  };