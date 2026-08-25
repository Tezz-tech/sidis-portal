const { processGradingJob } = require('../services/gradingService');

// Kept for an optional persistent-worker deployment (e.g. Render); the
// primary path on Vercel is the inline waitUntil-based processing triggered
// directly from gradingService.finalizeSubmission. auto-submit is no longer
// a scheduled job type — see attemptService.finalizeIfOverdue and
// deadlineSweepService for how deadlines are enforced instead.
function defineGradingJobs(agenda) {
  agenda.define('grade-attempt', { concurrency: 5 }, async (job) => {
    await processGradingJob(job.attrs.data.attemptId);
  });
}

module.exports = { defineGradingJobs };
