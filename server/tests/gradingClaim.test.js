const mongoose = require('mongoose');

jest.mock('../src/services/aiClient', () => ({
  callGemini: jest.fn(),
}));

let Organization;
let Participant;
let Exam;
let Question;
let Invitation;
let Attempt;
let CreditTransaction;
let gradingService;
let callGemini;

beforeAll(async () => {
  const connectDB = require('../src/config/db');
  await connectDB();
  ({ Organization, Participant, Exam, Question, Invitation, Attempt, CreditTransaction } = require('../src/models'));
  gradingService = require('../src/services/gradingService');
  ({ callGemini } = require('../src/services/aiClient'));
});

afterAll(async () => {
  await mongoose.connection.close();
});

afterEach(async () => {
  jest.clearAllMocks();
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

async function setupSubmittedAttempt() {
  const org = await Organization.create({ name: 'Org', slug: `org-${new mongoose.Types.ObjectId()}`, creditBalance: 100 });
  const participant = await Participant.create({
    organization: org._id,
    email: 'p@example.com',
    firstName: 'Pat',
    lastName: 'Participant',
  });
  const exam = await Exam.create({
    organization: org._id,
    createdBy: new mongoose.Types.ObjectId(),
    title: 'Test Exam',
    status: 'published',
    questionCount: 1,
    totalPoints: 1,
  });
  const question = await Question.create({
    organization: org._id,
    exam: exam._id,
    order: 0,
    type: 'short_answer',
    prompt: 'Explain photosynthesis',
    expectedAnswer: 'Plants convert light to energy',
    points: 1,
    source: 'manual',
  });
  const invitation = await Invitation.create({
    organization: org._id,
    exam: exam._id,
    participant: participant._id,
    token: `tok-${new mongoose.Types.ObjectId()}`,
    status: 'submitted',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });
  const attempt = await Attempt.create({
    organization: org._id,
    exam: exam._id,
    participant: participant._id,
    invitation: invitation._id,
    status: 'submitted',
    questionOrder: [question._id],
    serverDeadlineAt: new Date(Date.now() + 60 * 60 * 1000),
    submittedAt: new Date(),
    answers: [{ question: question._id, textAnswer: 'Sunlight becomes energy' }],
  });
  return { org, participant, exam, question, invitation, attempt };
}

function aiResponse(questionId, overrides = {}) {
  return JSON.stringify({
    results: [{ questionId, isCorrect: true, pointsAwarded: 1, confidence: 0.95, reasoning: 'Correct', ...overrides }],
  });
}

describe('grading duplicate-run guard', () => {
  test('two concurrent runs for the same attempt only ever grade once', async () => {
    const ctx = await setupSubmittedAttempt();
    callGemini.mockImplementation(async () => {
      // A real AI call is slow enough for two invocations to genuinely
      // overlap — without the attempt-level claim, both would reach the
      // paid grading call and the final save.
      await new Promise((resolve) => setTimeout(resolve, 50));
      return aiResponse(ctx.question._id.toString());
    });

    await Promise.all([
      gradingService.processGradingJob(ctx.attempt._id.toString()),
      gradingService.processGradingJob(ctx.attempt._id.toString()),
    ]);

    expect(callGemini).toHaveBeenCalledTimes(1);
    const finalAttempt = await Attempt.findById(ctx.attempt._id);
    expect(finalAttempt.status).toBe('graded');

    const gradingEntries = await CreditTransaction.countDocuments({ organization: ctx.org._id, type: 'grading' });
    expect(gradingEntries).toBe(1);
  });

  test('a genuine grading failure is recorded, not left silently stuck', async () => {
    const ctx = await setupSubmittedAttempt();
    callGemini.mockRejectedValue(new Error('AI service is temporarily unavailable'));

    await gradingService.processGradingJob(ctx.attempt._id.toString());

    const finalAttempt = await Attempt.findById(ctx.attempt._id);
    expect(finalAttempt.status).toBe('submitted');
    expect(finalAttempt.gradingFailedAt).not.toBeNull();
    expect(finalAttempt.gradingFailReason).toContain('AI service is temporarily unavailable');
  });

  test('a fresh (non-stale) claim is not stolen by a concurrent retry', async () => {
    const ctx = await setupSubmittedAttempt();
    await Attempt.updateOne({ _id: ctx.attempt._id }, { gradingClaimedAt: new Date() });
    callGemini.mockResolvedValue(aiResponse(ctx.question._id.toString()));

    await gradingService.processGradingJob(ctx.attempt._id.toString());

    expect(callGemini).not.toHaveBeenCalled();
    const finalAttempt = await Attempt.findById(ctx.attempt._id);
    expect(finalAttempt.status).toBe('submitted');
  });

  test('an abandoned stale claim can be reclaimed', async () => {
    const ctx = await setupSubmittedAttempt();
    const longAgo = new Date(Date.now() - 5 * 60 * 1000);
    await Attempt.updateOne({ _id: ctx.attempt._id }, { gradingClaimedAt: longAgo });
    callGemini.mockResolvedValue(aiResponse(ctx.question._id.toString()));

    await gradingService.processGradingJob(ctx.attempt._id.toString());

    expect(callGemini).toHaveBeenCalledTimes(1);
    const finalAttempt = await Attempt.findById(ctx.attempt._id);
    expect(finalAttempt.status).toBe('graded');
  });
});
