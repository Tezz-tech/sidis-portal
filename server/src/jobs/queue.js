const mongoose = require('mongoose');
const { getReadyAgenda } = require('../config/agenda');

/**
 * Kicks off question generation and returns an id the frontend can poll via
 * getGenerationJobStatus. agenda.now() runs the job as soon as a worker
 * process picks it up — this call only inserts the job document, it does not
 * wait for it to run.
 */
async function enqueueGeneration(data) {
  const agenda = await getReadyAgenda();
  const job = await agenda.now('generate-questions', { ...data, progress: { step: 'queued', percent: 0 } });
  return job.attrs._id.toString();
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

  return {
    state,
    progress: data?.progress || { step: 'queued', percent: 0 },
    failedReason: failReason || null,
    result: data?.result || null,
  };
}

/**
 * Schedules a server-side, browser-independent auto-submit for an attempt at
 * an exact deadline. Cancelling any existing auto-submit job for this
 * attempt before scheduling keeps this idempotent across resumes.
 */
async function scheduleAutoSubmit(attemptId, deadlineDate) {
  const agenda = await getReadyAgenda();
  await agenda.cancel({ name: 'auto-submit', 'data.attemptId': attemptId });
  await agenda.schedule(deadlineDate, 'auto-submit', { attemptId });
}

async function enqueueGrading(attemptId) {
  const agenda = await getReadyAgenda();
  await agenda.now('grade-attempt', { attemptId });
}

module.exports = { enqueueGeneration, getGenerationJobStatus, scheduleAutoSubmit, enqueueGrading };
