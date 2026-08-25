const { scoped } = require('./scopedRepo');
const { Invitation, Attempt } = require('../models');
const examService = require('./examService');
const { sweepOverdueAttempts } = require('./deadlineSweepService');

async function getLiveMonitor(tenant, examId) {
  await examService.getExam(tenant, examId);
  await sweepOverdueAttempts(examId);

  const [invitations, attempts] = await Promise.all([
    scoped(Invitation, tenant).find({ exam: examId }).populate('participant', 'firstName lastName email externalId'),
    scoped(Attempt, tenant).find({ exam: examId }),
  ]);

  const attemptByInvitation = new Map(attempts.map((a) => [a.invitation.toString(), a]));
  const now = Date.now();

  return invitations.map((inv) => {
    const attempt = attemptByInvitation.get(inv._id.toString());
    return {
      invitationId: inv._id,
      participant: inv.participant,
      invitationStatus: inv.status,
      attemptStatus: attempt?.status || 'not_started',
      startedAt: attempt?.startedAt || null,
      submittedAt: attempt?.submittedAt || null,
      secondsRemaining: attempt && attempt.status === 'in_progress'
        ? Math.max(0, Math.round((new Date(attempt.serverDeadlineAt).getTime() - now) / 1000))
        : null,
      integrity: attempt?.integrity || null,
    };
  });
}

module.exports = { getLiveMonitor };
