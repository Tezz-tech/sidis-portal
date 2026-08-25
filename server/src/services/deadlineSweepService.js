const { Attempt } = require('../models');
const { finalizeSubmission } = require('./gradingService');

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
}

module.exports = { sweepOverdueAttempts };
