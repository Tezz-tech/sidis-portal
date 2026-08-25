const mongoose = require('mongoose');
const { getReadyAgenda } = require('../config/agenda');
const { runGenerationJobNow, releaseFullReservation, RETRYABLE_STEPS } = require('./generationWorker');
const { runInBackground } = require('../utils/runInBackground');
const logger = require('../config/logger');

// How long to wait before treating a job as stuck. Generously above any
// realistic single-step duration, but short enough that a user watching the
// progress screen isn't stuck waiting for long — the frontend already polls
// every ~1.5s, so recovery kicks in on the very next poll once this elapses.
const STUCK_THRESHOLD_MS = 20 * 1000;

/**
 * Kicks off question generation. Returns the created job (not just its id)
 * so the caller can immediately start processing it inline via waitUntil —
 * there is no separate always-on worker picking these up.
 */
async function enqueueGeneration(data) {
  const agenda = await getReadyAgenda();
  const job = await agenda.now('generate-questions', {
    ...data,
    progress: { step: 'queued', percent: 0, updatedAt: new Date().toISOString() },
  });
  return job;
}

async function getGenerationJobStatus(jobId) {
  const agenda = await getReadyAgenda();
  const jobs = await agenda.jobs({ _id: new mongoose.Types.ObjectId(jobId) });
  const job = jobs[0];
  if (!job) return null;

  const { failReason, lastFinishedAt, lastRunAt, data } = job.attrs;
  let state = 'waiting';
  if (failReason) state = 'failed';
  else if (lastFinishedAt) state = 'completed';
  else if (lastRunAt) state = 'active';

  // Self-healing: if nothing has touched this job in a while and it hasn't
  // reached a terminal state, either resume it (safe — no writes have
  // happened yet) or fail it cleanly (unsafe to blindly retry past the
  // point questions may have already been inserted). This is what takes the
  // place of a dedicated worker retrying stalled work.
  if (state !== 'completed' && state !== 'failed') {
    const updatedAt = data?.progress?.updatedAt ? new Date(data.progress.updatedAt).getTime() : 0;
    const sinceUpdate = Date.now() - updatedAt;
    if (sinceUpdate > STUCK_THRESHOLD_MS) {
      const step = data?.progress?.step || 'queued';
      if (RETRYABLE_STEPS.has(step)) {
        logger.warn({ jobId, step }, 'Generation job looked stuck — retrying inline');
        runInBackground(() => runGenerationJobNow(job), 'generation-retry');
      } else {
        logger.warn({ jobId, step }, 'Generation job stuck past the safe-retry point — failing it');
        await releaseFullReservation(data);
        job.attrs.failReason = 'Generation did not finish in time. Your credits have been released — try again.';
        job.attrs.lastFinishedAt = new Date();
        await job.save();
        state = 'failed';
      }
    }
  }

  return {
    state,
    progress: data?.progress || { step: 'queued', percent: 0 },
    failedReason: job.attrs.failReason || null,
    result: data?.result || null,
  };
}

async function enqueueGrading(attemptId) {
  const agenda = await getReadyAgenda();
  await agenda.now('grade-attempt', { attemptId });
}

module.exports = { enqueueGeneration, getGenerationJobStatus, enqueueGrading };
