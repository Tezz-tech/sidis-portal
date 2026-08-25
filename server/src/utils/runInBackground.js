const logger = require('../config/logger');

// On Vercel, waitUntil() lets a function keep running after it has already
// sent its response — exactly what's needed to kick off generation/grading
// the moment a job is created instead of depending on a separate always-on
// worker process (which doesn't exist on a serverless deployment). Outside
// Vercel (local dev, tests, or a persistent process like Render), there's no
// response to hurry back to, so the task just runs and is awaited normally.
let waitUntil;
try {
  // eslint-disable-next-line global-require
  waitUntil = require('@vercel/functions').waitUntil;
} catch (err) {
  waitUntil = null;
}

/**
 * Runs an async task without blocking the current response. `taskFactory` is
 * a function (not a promise) so the task only starts once this is called.
 */
function runInBackground(taskFactory, label = 'background-task') {
  const promise = taskFactory().catch((err) => {
    logger.error({ err, label }, 'Background task failed');
  });
  if (waitUntil) {
    waitUntil(promise);
  }
  return promise;
}

module.exports = { runInBackground };
