const mongoose = require('mongoose');
const env = require('./env');
const logger = require('./logger');

const MAX_RETRIES = 8;
const BASE_DELAY_MS = 1000;

async function connectDB(attempt = 1) {
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
    return connectDB(attempt + 1);
  }
}

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected');
});

module.exports = connectDB;
