const mongoose = require('mongoose');
const logger = require('../utils/logger'); 


const DB_CONFIG = {
  serverSelectionTimeoutMS: 5000,
  maxPoolSize: 10,
  socketTimeoutMS: 30000, // 30 seconds operation timeout
};

const MAX_RETRY_ATTEMPTS = 3;
let retryCount = 0;

async function connectWithRetry() {
  try {
    await mongoose.connect(process.env.MONGO_DB_CONNECTION, DB_CONFIG);
    logger.info('✅ MongoDB connected successfully');
    
    setupEventListeners();
    setupGracefulShutdown();

  } catch (err) {
    handleConnectionError(err);
  }
}

function setupEventListeners() {
  mongoose.connection.on('connected', () => {
    logger.info('Mongoose connected to DB');
  });

  mongoose.connection.on('error', (err) => {
    logger.error(`Mongoose connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('Mongoose disconnected from DB');
    // Optionally implement auto-reconnect here
  });
}

function setupGracefulShutdown() {
  const shutdownSignals = ['SIGINT', 'SIGTERM', 'SIGUSR2'];
  
  shutdownSignals.forEach(signal => {
    process.on(signal, async () => {
      try {
        await mongoose.connection.close();
        logger.info('Mongoose connection closed due to app termination');
        process.exit(0);
      } catch (err) {
        logger.error('Error closing mongoose connection:', err);
        process.exit(1);
      }
    });
  });
}

async function handleConnectionError(err) {
  retryCount++;
  logger.error(`❌ MongoDB connection failed (attempt ${retryCount}): ${err.message}`);
  
  if (retryCount < MAX_RETRY_ATTEMPTS) {
    logger.info(`Retrying connection in 5 seconds...`);
    setTimeout(connectWithRetry, 5000);
  } else {
    logger.error('Max retry attempts reached. Exiting...');
    process.exit(1);
  }
}

// Initialize the connection
connectWithRetry()
  .catch