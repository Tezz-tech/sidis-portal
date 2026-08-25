const connectDB = require('./config/db');
const logger = require('./config/logger');
const { getAgenda } = require('./config/agenda');
const { defineGenerationJob } = require('./jobs/generationWorker');
const { defineGradingJobs } = require('./jobs/gradingWorker');

async function start() {
  await connectDB();
  const agenda = getAgenda();
  defineGenerationJob(agenda);
  defineGradingJobs(agenda);
  await agenda.start();
  logger.info('Sidis Portal worker started (generation + grading jobs, backed by MongoDB)');
}

start().catch((err) => {
  logger.error({ err }, 'Failed to start worker');
  process.exit(1);
});

process.on('SIGTERM', async () => {
  logger.info('Worker received SIGTERM, shutting down');
  const agenda = getAgenda();
  await agenda.stop();
  process.exit(0);
});
