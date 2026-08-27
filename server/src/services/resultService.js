const { scoped } = require('./scopedRepo');
const { Attempt, Question } = require('../models');
const examService = require('./examService');
const AppError = require('../utils/AppError');
const { writeAuditLog } = require('./auditService');
const { sweepOverdueAttempts } = require('./deadlineSweepService');
const { processGradingJob } = require('./gradingService');

async function listResults(tenant, examId, { status } = {}) {
  await examService.getExam(tenant, examId);
  await sweepOverdueAttempts(examId);
  const filter = { exam: examId };
  if (status) filter.status = status;
  else filter.status = { $in: ['submitted', 'graded'] };

  const attempts = await scoped(Attempt, tenant).find(filter).populate('participant', 'firstName lastName email externalId').sort({ submittedAt: -1 });

  return attempts.map((a) => ({
    attemptId: a._id,
    participant: a.participant,
    status: a.status,
    score: a.score,
    percentage: a.percentage,
    passed: a.passed,
    submittedAt: a.submittedAt,
    gradedAt: a.gradedAt,
    hasLowConfidenceFlags: a.answers.some((ans) => ans.flaggedForReview),
    integrity: a.integrity,
    gradingFailReason: a.gradingFailReason,
  }));
}

async function getResultDetail(tenant, examId, attemptId) {
  await examService.getExam(tenant, examId);
  const attempt = await scoped(Attempt, tenant).findOne({ _id: attemptId, exam: examId }).populate('participant', 'firstName lastName email externalId');
  if (!attempt) throw new AppError('Result not found', 404, 'NOT_FOUND');

  const questions = await scoped(Question, tenant).find({ exam: examId });
  const questionsById = new Map(questions.map((q) => [q._id.toString(), q]));

  const answers = attempt.answers.map((a) => {
    const q = questionsById.get(a.question.toString());
    return {
      questionId: a.question,
      prompt: q?.prompt,
      type: q?.type,
      options: q?.options,
      correctOptionKey: q?.correctOptionKey,
      expectedAnswer: q?.expectedAnswer,
      selectedOptionKey: a.selectedOptionKey,
      textAnswer: a.textAnswer,
      isCorrect: a.isCorrect,
      pointsAwarded: a.pointsAwarded,
      maxPoints: q?.points,
      aiConfidence: a.aiConfidence,
      aiReasoning: a.aiReasoning,
      flaggedForReview: a.flaggedForReview,
      overriddenBy: a.overriddenBy,
      overrideReason: a.overrideReason,
    };
  });

  return {
    attemptId: attempt._id,
    participant: attempt.participant,
    status: attempt.status,
    score: attempt.score,
    percentage: attempt.percentage,
    passed: attempt.passed,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    gradedAt: attempt.gradedAt,
    integrity: attempt.integrity,
    gradingFailReason: attempt.gradingFailReason,
    answers,
  };
}

async function retryGrading(tenant, examId, attemptId) {
  const attempt = await scoped(Attempt, tenant).findOne({ _id: attemptId, exam: examId });
  if (!attempt) throw new AppError('Result not found', 404, 'NOT_FOUND');
  if (attempt.status !== 'submitted' || !attempt.gradingFailReason) {
    throw new AppError('This result is not in a failed-grading state', 400, 'NOT_FAILED');
  }

  attempt.gradingClaimedAt = null;
  attempt.gradingFailedAt = null;
  attempt.gradingFailReason = null;
  await attempt.save();

  // Awaited, not fire-and-forget — this is an explicit, infrequent admin
  // action, so the request should return a real success/fail answer rather
  // than leaving the admin to guess by refreshing.
  await processGradingJob(attemptId);

  return getResultDetail(tenant, examId, attemptId);
}

async function overrideScore(tenant, examId, attemptId, { questionId, pointsAwarded, reason }, actorId) {
  const attempt = await scoped(Attempt, tenant).findOne({ _id: attemptId, exam: examId });
  if (!attempt) throw new AppError('Result not found', 404, 'NOT_FOUND');

  const question = await scoped(Question, tenant).findById(questionId);
  if (!question) throw new AppError('Question not found', 404, 'NOT_FOUND');

  const idx = attempt.answers.findIndex((a) => a.question.toString() === questionId);
  if (idx === -1) throw new AppError('Answer not found', 404, 'NOT_FOUND');

  const clamped = Math.max(0, Math.min(question.points, pointsAwarded));
  attempt.answers[idx].pointsAwarded = clamped;
  attempt.answers[idx].isCorrect = clamped >= question.points;
  attempt.answers[idx].overriddenBy = actorId;
  attempt.answers[idx].overrideReason = reason;

  attempt.score = attempt.answers.reduce((sum, a) => sum + (a.pointsAwarded || 0), 0);
  const exam = await examService.getExam(tenant, examId);
  attempt.percentage = exam.totalPoints > 0 ? Math.round((attempt.score / exam.totalPoints) * 1000) / 10 : 0;
  attempt.passed = attempt.percentage >= exam.config.passMark;

  await attempt.save();

  await writeAuditLog({
    organization: tenant.organizationId,
    actor: actorId,
    action: 'result.score_overridden',
    targetModel: 'Attempt',
    targetId: attemptId,
    metadata: { questionId, pointsAwarded: clamped, reason },
  });

  return attempt;
}

function toCsvValue(value) {
  const str = String(value ?? '');
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

async function exportResultsCsv(tenant, examId) {
  const results = await listResults(tenant, examId, {});
  const header = ['Name', 'Email', 'External ID', 'Status', 'Score', 'Percentage', 'Passed', 'Submitted At'];
  const rows = results.map((r) => [
    `${r.participant.firstName} ${r.participant.lastName}`,
    r.participant.email,
    r.participant.externalId || '',
    r.status,
    r.score,
    r.percentage,
    r.passed === null ? '' : (r.passed ? 'Yes' : 'No'),
    r.submittedAt ? new Date(r.submittedAt).toISOString() : '',
  ]);
  return [header, ...rows].map((row) => row.map(toCsvValue).join(',')).join('\n');
}

module.exports = { listResults, getResultDetail, overrideScore, exportResultsCsv, retryGrading };
