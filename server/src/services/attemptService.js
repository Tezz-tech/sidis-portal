const { Attempt, Invitation, Exam, Question } = require('../models');
const { shuffle } = require('../utils/shuffle');
const AppError = require('../utils/AppError');
const { finalizeSubmission, processGradingJob } = require('./gradingService');
const { autoCloseIfOverdue } = require('./deadlineSweepService');
const { runInBackground } = require('../utils/runInBackground');

async function loadContext(session) {
  await autoCloseIfOverdue(session.examId);
  const [invitation, exam] = await Promise.all([
    Invitation.findOne({ _id: session.invitationId, organization: session.organizationId }),
    Exam.findOne({ _id: session.examId, organization: session.organizationId }),
  ]);
  if (!invitation || !exam) throw new AppError('This session is no longer valid', 404, 'NOT_FOUND');
  return { invitation, exam };
}

async function buildOrders(examId, exam) {
  const questions = await Question.find({ exam: examId }).sort({ order: 1 });
  const questionOrder = exam.config.shuffleQuestions
    ? shuffle(questions).map((q) => q._id)
    : questions.map((q) => q._id);

  const optionOrder = new Map();
  if (exam.config.shuffleOptions) {
    for (const q of questions) {
      if (q.options && q.options.length > 0) {
        optionOrder.set(q._id.toString(), shuffle(q.options.map((o) => o.key)));
      }
    }
  }
  return { questionOrder, optionOrder, questions };
}

async function getOrCreateAttempt(session) {
  const { invitation, exam } = await loadContext(session);

  const existingInProgress = await Attempt.findOne({ invitation: invitation._id, status: 'in_progress' });
  if (existingInProgress) return existingInProgress;

  if (exam.status !== 'published') {
    throw new AppError('This exam is not currently open for new attempts', 400, 'EXAM_CLOSED');
  }
  const attemptCount = await Attempt.countDocuments({ invitation: invitation._id });
  if (attemptCount > 0 && !exam.config.allowRetakes) {
    throw new AppError('You have already completed this exam', 400, 'ALREADY_ATTEMPTED');
  }
  if (attemptCount >= exam.config.maxAttempts) {
    throw new AppError('You have used all of your attempts for this exam', 400, 'MAX_ATTEMPTS_REACHED');
  }
  if (exam.config.opensAt && new Date() < new Date(exam.config.opensAt)) {
    throw new AppError('This exam has not opened yet', 400, 'NOT_OPEN');
  }
  if (exam.config.closesAt && new Date() > new Date(exam.config.closesAt)) {
    throw new AppError('This exam has closed', 400, 'EXAM_CLOSED');
  }

  const { questionOrder, optionOrder } = await buildOrders(exam._id, exam);
  const now = new Date();
  const serverDeadlineAt = new Date(now.getTime() + exam.config.durationMinutes * 60 * 1000);

  const attempt = await Attempt.create({
    organization: session.organizationId,
    exam: exam._id,
    participant: session.participantId,
    invitation: invitation._id,
    status: 'in_progress',
    questionOrder,
    optionOrder,
    startedAt: now,
    serverDeadlineAt,
    integrity: {},
  });

  invitation.status = 'started';
  await invitation.save();

  return attempt;
}

/**
 * Finalizes an attempt if its deadline has passed. There's no persistent
 * worker to enforce this at the exact deadline moment, so it's checked
 * opportunistically instead — every participant-facing read/write on an
 * in-progress attempt, plus the staff live monitor and results views (see
 * monitorService/resultService), calls this first. Between those call
 * sites, an overdue attempt is caught within moments in virtually every
 * real case: the participant's own next action, or a creator glancing at
 * the monitor, which already polls every few seconds while open.
 */
async function finalizeIfOverdue(attempt) {
  if (attempt.status !== 'in_progress') return attempt;
  if (new Date() <= new Date(attempt.serverDeadlineAt)) return attempt;
  return finalizeSubmission(attempt._id);
}

async function getRunnerState(session) {
  let attempt = await Attempt.findOne({ invitation: session.invitationId, status: 'in_progress' });
  if (!attempt) throw new AppError('No exam is currently in progress for this invitation', 404, 'NO_ACTIVE_ATTEMPT');

  attempt = await finalizeIfOverdue(attempt);
  if (attempt.status !== 'in_progress') {
    throw new AppError('Time is up for this exam. It has been submitted automatically.', 400, 'DEADLINE_PASSED');
  }

  const { exam } = await loadContext(session);
  const questions = await Question.find({ _id: { $in: attempt.questionOrder } });
  const questionsById = new Map(questions.map((q) => [q._id.toString(), q]));

  const orderedQuestions = attempt.questionOrder.map((id) => {
    const q = questionsById.get(id.toString());
    const optionKeys = attempt.optionOrder?.get(id.toString());
    const options = optionKeys
      ? optionKeys.map((key) => q.options.find((o) => o.key === key))
      : q.options;
    return {
      id: q._id,
      type: q.type,
      prompt: q.prompt,
      options: options ? options.map((o) => ({ key: o.key, text: o.text })) : [],
      points: q.points,
    };
  });

  const answersByQuestion = new Map(attempt.answers.map((a) => [a.question.toString(), a]));

  return {
    examTitle: exam.title,
    durationMinutes: exam.config.durationMinutes,
    serverDeadlineAt: attempt.serverDeadlineAt,
    startedAt: attempt.startedAt,
    questions: orderedQuestions,
    answers: orderedQuestions.map((q) => {
      const a = answersByQuestion.get(q.id.toString());
      return {
        questionId: q.id,
        selectedOptionKey: a?.selectedOptionKey || null,
        textAnswer: a?.textAnswer || null,
        flaggedForReview: a?.flaggedForReview || false,
      };
    }),
  };
}

async function saveAnswer(session, questionId, { selectedOptionKey, textAnswer, flaggedForReview }) {
  let attempt = await Attempt.findOne({ invitation: session.invitationId, status: 'in_progress' });
  if (!attempt) throw new AppError('No exam is currently in progress for this invitation', 404, 'NO_ACTIVE_ATTEMPT');

  attempt = await finalizeIfOverdue(attempt);
  if (attempt.status !== 'in_progress') {
    throw new AppError('Time is up for this exam. It has been submitted automatically.', 400, 'DEADLINE_PASSED');
  }

  const idx = attempt.answers.findIndex((a) => a.question.toString() === questionId);
  const patch = {
    question: questionId,
    selectedOptionKey: selectedOptionKey ?? (idx >= 0 ? attempt.answers[idx].selectedOptionKey : null),
    textAnswer: textAnswer ?? (idx >= 0 ? attempt.answers[idx].textAnswer : null),
    flaggedForReview: flaggedForReview ?? (idx >= 0 ? attempt.answers[idx].flaggedForReview : false),
    answeredAt: new Date(),
  };

  if (idx >= 0) {
    attempt.answers[idx] = { ...attempt.answers[idx].toObject(), ...patch };
  } else {
    attempt.answers.push(patch);
  }
  await attempt.save();
  return { savedAt: patch.answeredAt };
}

async function recordIntegrityEvent(session, event) {
  const attempt = await Attempt.findOne({ invitation: session.invitationId, status: 'in_progress' });
  if (!attempt) return;
  const inc = {};
  if (event === 'tab_switch') inc['integrity.tabSwitches'] = 1;
  if (event === 'window_blur') inc['integrity.windowBlurs'] = 1;
  if (event === 'fullscreen_exit') inc['integrity.fullscreenExits'] = 1;
  if (Object.keys(inc).length === 0) return;
  await Attempt.updateOne({ _id: attempt._id }, { $inc: inc });
}

async function getStatus(session) {
  const attempt = await Attempt.findOne({ invitation: session.invitationId }).sort({ createdAt: -1 });
  if (!attempt) return { status: 'not_started' };
  return { status: attempt.status, attemptId: attempt._id };
}

// If grading has been sitting in 'submitted' this long without reaching
// 'graded', treat it as stuck (e.g. the invocation that started it got cut
// off) and kick off a fresh attempt inline. Re-running processGradingJob is
// safe even if the original run eventually does finish — it early-returns
// once status is no longer 'submitted'.
const GRADING_STUCK_THRESHOLD_MS = 20 * 1000;

async function getParticipantResult(session) {
  const attempt = await Attempt.findOne({ invitation: session.invitationId }).sort({ createdAt: -1 });
  if (!attempt) throw new AppError('No attempt found', 404, 'NOT_FOUND');
  const { exam } = await loadContext(session);

  if (attempt.status === 'submitted' && Date.now() - new Date(attempt.submittedAt).getTime() > GRADING_STUCK_THRESHOLD_MS) {
    runInBackground(() => processGradingJob(attempt._id.toString()), 'grading-retry');
  }

  if (attempt.status !== 'graded') {
    return { status: attempt.status, ready: false };
  }

  if (exam.config.resultVisibility === 'never') {
    return { status: 'graded', ready: false, message: 'Results for this exam are not shared with participants.' };
  }
  if (exam.config.resultVisibility === 'after_close' && exam.status !== 'closed') {
    return { status: 'graded', ready: false, message: 'Results will be available after the exam closes.' };
  }

  const breakdown = exam.config.showCorrectAnswers
    ? await buildBreakdown(attempt, exam)
    : undefined;

  return {
    status: 'graded',
    ready: true,
    score: attempt.score,
    totalPoints: exam.totalPoints,
    percentage: attempt.percentage,
    passed: attempt.passed,
    passMark: exam.config.passMark,
    breakdown,
  };
}

async function buildBreakdown(attempt, exam) {
  const questions = await Question.find({ exam: exam._id });
  const questionsById = new Map(questions.map((q) => [q._id.toString(), q]));
  return attempt.answers.map((a) => {
    const q = questionsById.get(a.question.toString());
    return {
      prompt: q.prompt,
      type: q.type,
      yourAnswer: a.selectedOptionKey || a.textAnswer,
      correctAnswer: q.type === 'short_answer' ? q.expectedAnswer : q.correctOptionKey,
      isCorrect: a.isCorrect,
      pointsAwarded: a.pointsAwarded,
    };
  });
}

module.exports = {
  getOrCreateAttempt,
  getRunnerState,
  saveAnswer,
  recordIntegrityEvent,
  loadContext,
  getStatus,
  getParticipantResult,
  finalizeIfOverdue,
};
