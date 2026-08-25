const app = require('./app');
const env = require('./config/env');
const logger = require('./config/logger');
const connectDB = require('./config/db');

async function start() {
  await connectDB();
  app.listen(env.PORT, () => {
    logger.info(`Sidis Portal API listening on port ${env.PORT}`);
  });
}

start().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
