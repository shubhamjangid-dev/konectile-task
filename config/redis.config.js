const { createClient } = require("redis");
const logger = require("../utils/logger");

const redisConfig = {
  url: process.env.REDIS_URL || "redis://localhost:6379",
  socket: {
    reconnectStrategy: retries => {
      if (retries > 10) {
        logger.error("Too many retries on Redis. Connection Terminated");
        return new Error("Too many retries");
      }
      return Math.min(retries * 100, 5000);
    },
  },
};

const redisClient = createClient(redisConfig);

// Store original methods
const originalRedisMethods = {
  get: redisClient.get.bind(redisClient),
  setEx: redisClient.setEx.bind(redisClient),
  del: redisClient.del.bind(redisClient),
  keys: redisClient.keys.bind(redisClient),
};

// Override methods with error handling
redisClient.get = async key => {
  try {
    return await originalRedisMethods.get(key);
  } catch (err) {
    logger.error(`Redis GET error for key ${key}:`, err);
    throw err;
  }
};

redisClient.setEx = async (key, ttl, value) => {
  try {
    return await originalRedisMethods.setEx(key, ttl, value);
  } catch (err) {
    logger.error(`Redis SETEX error for key ${key}:`, err);
    throw err;
  }
};

redisClient.del = async key => {
  try {
    return await originalRedisMethods.del(key);
  } catch (err) {
    logger.error(`Redis DEL error for key ${key}:`, err);
    throw err;
  }
};

redisClient.keys = async pattern => {
  try {
    return await originalRedisMethods.keys(pattern);
  } catch (err) {
    logger.error(`Redis KEYS error for pattern ${pattern}:`, err);
    throw err;
  }
};

// Connection events
redisClient.on("connect", () => logger.info("Redis client connected"));
redisClient.on("ready", () => logger.info("Redis client ready"));
redisClient.on("error", err => logger.error("Redis client error:", err));
redisClient.on("end", () => logger.info("Redis client disconnected"));
redisClient.on("reconnecting", () => logger.info("Redis client reconnecting"));

// Connect to Redis
const connectRedis = async () => {
  try {
    await redisClient.connect();
    logger.info("Redis connection established");
  } catch (err) {
    logger.error("Redis connection failed:", err);
    process.exit(1);
  }
};

module.exports = { redisClient, connectRedis };
