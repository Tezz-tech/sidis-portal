const { z } = require('zod');
const { Attempt, Question, Exam, Invitation } = require('../models');
const { callClaude, extractJsonText } = require('./aiClient');
const env = require('../config/env');
const creditService = require('./creditService');
const { enqueueGrading } = require('../jobs/queue');
const logger = require('../config/logger');

const LOW_CONFIDENCE_THRESHOLD = 0.7;

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

async function autoSubmitIfStillInProgress(attemptId) {
  const attempt = await Attempt.findById(attemptId);
  if (!attempt || attempt.status !== 'in_progress') return null;
  return finalizeSubmission(attemptId);
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
  return attempt;
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

  const response = await callClaude({
    model: env.AI_GRADING_MODEL,
    system,
    messages: [{ role: 'user', content: userPrompt }],
    maxTokens: Math.min(4096, 300 * shortAnswerItems.length + 512),
    organizationId: attempt.organization.toString(),
    label: 'short_answer_grading',
  });

  const raw = extractJsonText(response);
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
  const result = shortAnswerGradingResponseSchema.parse(parsed);
  return result.results;
}

async function processGradingJob(attemptId) {
  const attempt = await Attempt.findById(attemptId);
  if (!attempt || attempt.status !== 'submitted') return;

  const questions = await Question.find({ exam: attempt.exam });
  let results;
  try {
    results = await gradeShortAnswers(attempt, questions);
  } catch (err) {
    logger.error({ err, attemptId }, 'Short-answer grading failed');
    throw err;
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
  autoSubmitIfStillInProgress,
  computeFinalScore,
  gradeShortAnswers,
  processGradingJob,
};
