const { autoSubmitIfStillInProgress, processGradingJob } = require('../services/gradingService');

function defineGradingJobs(agenda) {
  agenda.define('auto-submit', async (job) => {
    await autoSubmitIfStillInProgress(job.attrs.data.attemptId);
  });

  agenda.define('grade-attempt', { concurrency: 5 }, async (job) => {
    await processGradingJob(job.attrs.data.attemptId);
  });
}

module.exports = { defineGradingJobs };
