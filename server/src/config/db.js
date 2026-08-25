const mongoose = require('mongoose');
const env = require('./env');
const logger = require('./logger');

const MAX_RETRIES = 8;
const BASE_DELAY_MS = 1000;

// Cached across invocations within the same warm serverless container (and a
// harmless no-op cache on a normal long-running process). Without this, a
// serverless platform that reuses the process between requests would still
// try to reconnect — or worse, race — on every call; with it, only the very
// first invocation on a given container pays the connection cost.
let connectionPromise = null;

async function connectWithRetry(attempt = 1) {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(env.MONGODB_URI, {
      dbName: 'SidisPortal',
    });
    logger.info('MongoDB connected');
  } catch (err) {
    if (attempt >= MAX_RETRIES) {
      logger.error({ err }, 'MongoDB connection failed after max retries');
      throw err;
    }
    const delay = BASE_DELAY_MS * 2 ** (attempt - 1);
    logger.warn({ attempt, delay }, 'MongoDB connection failed, retrying');
    await new Promise((resolve) => setTimeout(resolve, delay));
    return connectWithRetry(attempt + 1);
  }
}

async function connectDB() {
  if (mongoose.connection.readyState === 1) return; // already connected
  if (!connectionPromise) {
    connectionPromise = connectWithRetry().catch((err) => {
      connectionPromise = null; // let the next call retry from scratch
      throw err;
    });
  }
  return connectionPromise;
}

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
  connectionPromise = null;
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected');
});

module.exports = connectDB;
