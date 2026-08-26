const { Attempt, Exam } = require('../models');
const { finalizeSubmission } = require('./gradingService');

/**
 * A closesAt deadline passing doesn't by itself flip exam.status to
 * 'closed' — that's otherwise a manual staff action (examService.closeExam)
 * — but leaving it 'published' forever after the deadline keeps results
 * hidden from participants under the default 'after_close' visibility
 * setting, even though no one can start a new attempt any more (see
 * attemptService.getOrCreateAttempt). Cheap enough (a single conditional
 * update, no-op unless actually overdue) to call from every participant
 * action, not just the staff-facing sweep below.
 */
async function autoCloseIfOverdue(examId) {
  await Exam.updateOne(
    { _id: examId, status: 'published', 'config.closesAt': { $ne: null, $lte: new Date() } },
    { status: 'closed' },
  );
}

/**
 * Finalizes every overdue in-progress attempt for an exam. There's no
 * persistent worker to do this at the exact deadline moment (see
 * attemptService.finalizeIfOverdue for the participant-facing equivalent),
 * so staff-facing views that look at attempts across an exam — the live
 * monitor and the results list, both already polled/opened frequently —
 * sweep for stragglers every time they're loaded.
 */
async function sweepOverdueAttempts(examId) {
  const overdue = await Attempt.find({
    exam: examId,
    status: 'in_progress',
    serverDeadlineAt: { $lte: new Date() },
  }).select('_id');

  await Promise.all(overdue.map((a) => finalizeSubmission(a._id)));
  await autoCloseIfOverdue(examId);
}

module.exports = { sweepOverdueAttempts, autoCloseIfOverdue };
