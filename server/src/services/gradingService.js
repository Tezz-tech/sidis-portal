const { z } = require('zod');
const { Attempt, Question, Exam, Invitation, Participant, User } = require('../models');
const { callGemini } = require('./aiClient');
const creditService = require('./creditService');
const { enqueueGrading } = require('../jobs/queue');
const { runInBackground } = require('../utils/runInBackground');
const emailService = require('./emailService');
const logger = require('../config/logger');

const LOW_CONFIDENCE_THRESHOLD = 0.7;

// Mirrors generationWorker.js's STALE_CLAIM_MS. A claim older than this is
// treated as abandoned (the execution that held it almost certainly died
// mid-flight) and becomes reclaimable, so a failed/interrupted run doesn't
// leave the attempt stuck at 'submitted' with no way to ever retry it.
const GRADING_STALE_CLAIM_MS = 90 * 1000;

function gradeObjectiveAnswer(answer, question) {
  const isCorrect = answer.selectedOptionKey != null && answer.selectedOptionKey === question.correctOptionKey;
  return { isCorrect, pointsAwarded: isCorrect ? question.points : 0 };
}

/**
 * Called on submit. Objective questions (mcq/true_false) are graded
 * instantly in code at no credit cost. If the exam has short-answer
 * questions, grading finishes asynchronously through the queue and the
 * participant sees "Submitted — your result is being prepared" until then.
 */
async function submitAttempt(session) {
  const attempt = await Attempt.findOne({ invitation: session.invitationId, status: 'in_progress' });
  if (!attempt) {
    const alreadySubmitted = await Attempt.findOne({ invitation: session.invitationId }).sort({ createdAt: -1 });
    if (alreadySubmitted) return alreadySubmitted;
    throw new Error('No active attempt to submit');
  }
  return finalizeSubmission(attempt._id);
}

async function finalizeSubmission(attemptId) {
  const attempt = await Attempt.findById(attemptId);
  if (!attempt || attempt.status !== 'in_progress') return attempt;

  const questions = await Question.find({ exam: attempt.exam });
  const questionsById = new Map(questions.map((q) => [q._id.toString(), q]));

  let hasShortAnswer = false;
  attempt.answers = attempt.answers.map((answer) => {
    const question = questionsById.get(answer.question.toString());
    if (!question) return answer;
    if (question.type === 'short_answer') {
      hasShortAnswer = true;
      return answer;
    }
    const { isCorrect, pointsAwarded } = gradeObjectiveAnswer(answer, question);
    return { ...answer.toObject(), isCorrect, pointsAwarded };
  });

  // Ensure every question has an answer entry, even if the participant left
  // it blank, so grading and result views have a complete record.
  for (const q of questions) {
    if (!attempt.answers.find((a) => a.question.toString() === q._id.toString())) {
      const blank = { question: q._id, selectedOptionKey: null, textAnswer: null };
      if (q.type === 'short_answer') {
        hasShortAnswer = true;
        attempt.answers.push(blank);
      } else {
        attempt.answers.push({ ...blank, isCorrect: false, pointsAwarded: 0 });
      }
    }
  }

  attempt.status = 'submitted';
  attempt.submittedAt = new Date();
  await attempt.save();

  await Invitation.updateOne({ _id: attempt.invitation }, { status: 'submitted' });

  if (hasShortAnswer) {
    await enqueueGrading(attempt._id.toString());
    // No separate always-on worker picks this up — start grading right now,
    // continuing after this request has responded (waitUntil on Vercel).
    runInBackground(() => processGradingJob(attempt._id.toString()), 'grading-start');
  } else {
    await computeFinalScore(attempt._id);
  }

  return Attempt.findById(attemptId);
}

async function computeFinalScore(attemptId) {
  const attempt = await Attempt.findById(attemptId);
  const exam = await Exam.findById(attempt.exam);

  const score = attempt.answers.reduce((sum, a) => sum + (a.pointsAwarded || 0), 0);
  const percentage = exam.totalPoints > 0 ? Math.round((score / exam.totalPoints) * 1000) / 10 : 0;
  const passed = percentage >= exam.config.passMark;

  attempt.score = score;
  attempt.percentage = percentage;
  attempt.passed = passed;
  attempt.status = 'graded';
  attempt.gradedAt = new Date();
  await attempt.save();

  // Best-effort — a failed notification must never fail grading itself,
  // which has already been persisted above.
  notifyAttemptGraded(attempt, exam).catch((err) => logger.warn({ err, attemptId: attempt._id.toString() }, 'Failed to send grading-complete emails'));

  return attempt;
}

async function notifyAttemptGraded(attempt, exam) {
  const [invitation, participant, creator] = await Promise.all([
    Invitation.findById(attempt.invitation),
    Participant.findById(attempt.participant),
    User.findById(exam.createdBy),
  ]);
  if (!invitation || !participant) return;

  // resultVisibility 'never' means there's genuinely nothing for the
  // participant to view — skip their email rather than send a "your result
  // is ready" link that leads to a page saying results aren't shared.
  if (exam.config.resultVisibility !== 'never') {
    const canRevealNow = exam.config.resultVisibility === 'immediate'
      || (exam.config.resultVisibility === 'after_close' && exam.status === 'closed');
    await emailService.sendResultReadyEmail({
      to: participant.email,
      firstName: participant.firstName,
      examTitle: exam.title,
      invitationToken: invitation.token,
      result: canRevealNow ? {
        score: attempt.score,
        totalPoints: exam.totalPoints,
        percentage: attempt.percentage,
        passed: attempt.passed,
        passMark: exam.config.passMark,
      } : null,
    });
  }

  if (creator) {
    await emailService.sendAttemptCompleteToInstructorEmail({
      to: creator.email,
      firstName: creator.firstName,
      examTitle: exam.title,
      participantName: `${participant.firstName} ${participant.lastName}`,
      examId: exam._id.toString(),
    });
  }
}

const shortAnswerGradingResponseSchema = z.object({
  results: z.array(
    z.object({
      questionId: z.string(),
      isCorrect: z.boolean(),
      pointsAwarded: z.number().min(0),
      confidence: z.number().min(0).max(1),
      reasoning: z.string(),
    }),
  ),
});

/**
 * Grades every short-answer response on an attempt in a single batched
 * Claude call rather than one call per question — this is the high-volume
 * path (every submitted attempt with short-answer questions), so batching
 * keeps AI spend and latency down.
 */
async function gradeShortAnswers(attempt, questions) {
  const questionsById = new Map(questions.map((q) => [q._id.toString(), q]));
  const shortAnswerItems = attempt.answers
    .map((a) => ({ answer: a, question: questionsById.get(a.question.toString()) }))
    .filter((item) => item.question && item.question.type === 'short_answer');

  if (shortAnswerItems.length === 0) return [];

  const system = `You grade short-answer exam responses. For each item, decide whether the participant's response earns credit, using the expected answer and grading guidance provided. Give partial credit when appropriate. Be fair but strict about factual accuracy. Output strict JSON only: {"results":[{"questionId":"...","isCorrect":true,"pointsAwarded":1,"confidence":0.9,"reasoning":"..."}]}. confidence reflects how certain you are in this judgment, from 0 to 1.`;

  const userPrompt = `Grade these ${shortAnswerItems.length} responses:\n\n${shortAnswerItems
    .map((item, i) => `${i + 1}. questionId: ${item.question._id}
Question: ${item.question.prompt}
Expected answer: ${item.question.expectedAnswer || '(none provided)'}
Grading guidance: ${item.question.gradingGuidance || '(none provided)'}
Maximum points: ${item.question.points}
Participant's response: ${item.answer.textAnswer || '(no answer given)'}`)
    .join('\n\n')}\n\nReturn JSON only, one result per item, using the exact questionId given.`;

  const raw = await callGemini({
    systemInstruction: system,
    prompt: userPrompt,
    // See the matching comment in generationService.js — headroom above the
    // visible-output estimate for the rotated models' invisible "thinking".
    maxOutputTokens: Math.min(32768, 500 * shortAnswerItems.length + 4096),
    organizationId: attempt.organization.toString(),
    label: 'short_answer_grading',
  });

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
  const result = shortAnswerGradingResponseSchema.parse(parsed);
  return result.results;
}

async function processGradingJob(attemptId) {
  // Atomic claim (mirrors Exam.generationClaimedAt in generationWorker.js):
  // only one execution may ever reach the AI call for this attempt. Without
  // this, the inline runInBackground call from finalizeSubmission, the
  // queued 'grade-attempt' Agenda job (see jobs/gradingWorker.js — a
  // supported persistent-worker deployment), and the stuck-attempt retry in
  // attemptService.loadParticipantResult can all race and each trigger a
  // separate paid AI grading call for the same attempt.
  const claim = await Attempt.updateOne(
    {
      _id: attemptId,
      status: 'submitted',
      $or: [
        { gradingClaimedAt: null },
        { gradingClaimedAt: { $lte: new Date(Date.now() - GRADING_STALE_CLAIM_MS) } },
      ],
    },
    { gradingClaimedAt: new Date() },
  );
  if (claim.matchedCount === 0) {
    logger.warn({ attemptId }, 'Grading already claimed for this attempt — skipping duplicate run');
    return;
  }

  const attempt = await Attempt.findById(attemptId);
  if (!attempt || attempt.status !== 'submitted') return;

  const questions = await Question.find({ exam: attempt.exam });
  let results;
  try {
    results = await gradeShortAnswers(attempt, questions);
  } catch (err) {
    logger.error({ err, attemptId }, 'Short-answer grading failed');
    // Left as a terminal failure rather than re-thrown — the callers here
    // (runInBackground, the Agenda job) have nothing to do with a thrown
    // error but log it, which used to leave the attempt silently stuck at
    // 'submitted' forever with no way for anyone to know it had failed.
    attempt.gradingFailedAt = new Date();
    attempt.gradingFailReason = err.message || 'Grading failed';
    await attempt.save();
    return;
  }

  const resultsByQuestion = new Map(results.map((r) => [r.questionId, r]));
  attempt.answers = attempt.answers.map((a) => {
    const r = resultsByQuestion.get(a.question.toString());
    if (!r) return a;
    return {
      ...a.toObject(),
      isCorrect: r.isCorrect,
      pointsAwarded: r.pointsAwarded,
      aiConfidence: r.confidence,
      aiReasoning: r.reasoning,
      flaggedForReview: r.confidence < LOW_CONFIDENCE_THRESHOLD,
    };
  });
  await attempt.save();

  const shortAnswerCount = questions.filter((q) => q.type === 'short_answer').length;
  if (shortAnswerCount > 0) {
    await creditService.chargeGrading({
      organizationId: attempt.organization,
      amount: 0,
      reference: { model: 'Attempt', id: attempt._id },
      description: `Graded ${shortAnswerCount} short-answer responses (already reserved at publish)`,
    }).catch((err) => logger.warn({ err }, 'Failed to write grading ledger entry'));
  }

  await computeFinalScore(attemptId);
}

module.exports = {
  submitAttempt,
  finalizeSubmission,
  computeFinalScore,
  gradeShortAnswers,
  processGradingJob,
};
