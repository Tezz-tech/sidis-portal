const mongoose = require('mongoose');

let Organization;
let Exam;
let Question;
let Participant;
let Invitation;
let Attempt;
let attemptService;
let generateResultPdf;

beforeAll(async () => {
  const connectDB = require('../src/config/db');
  await connectDB();
  ({ Organization, Exam, Question, Participant, Invitation, Attempt } = require('../src/models'));
  attemptService = require('../src/services/attemptService');
  ({ generateResultPdf } = require('../src/services/resultPdfService'));
});

afterAll(async () => {
  await mongoose.connection.close();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

async function setupGradedAttempt({ resultVisibility = 'immediate', showCorrectAnswers = true, examStatus = 'published' } = {}) {
  const org = await Organization.create({ name: 'Org', slug: `org-${new mongoose.Types.ObjectId()}` });
  const exam = await Exam.create({
    organization: org._id,
    createdBy: new mongoose.Types.ObjectId(),
    title: 'Safety Exam',
    status: examStatus,
    questionCount: 2,
    totalPoints: 2,
    config: { resultVisibility, showCorrectAnswers, passMark: 50 },
  });

  const mcq = await Question.create({
    organization: org._id,
    exam: exam._id,
    order: 0,
    type: 'mcq',
    source: 'manual',
    prompt: 'What is the powerhouse of the cell?',
    options: [{ key: 'A', text: 'Nucleus' }, { key: 'B', text: 'Mitochondria' }],
    correctOptionKey: 'B',
    points: 1,
  });
  const shortAnswer = await Question.create({
    organization: org._id,
    exam: exam._id,
    order: 1,
    type: 'short_answer',
    source: 'manual',
    prompt: 'Explain why mitochondria matter.',
    expectedAnswer: 'They produce ATP.',
    gradingGuidance: 'Look for mention of energy production.',
    points: 1,
  });

  const participant = await Participant.create({ organization: org._id, email: 'p@example.com', firstName: 'Pat', lastName: 'Doe' });
  const invitation = await Invitation.create({
    organization: org._id,
    exam: exam._id,
    participant: participant._id,
    token: `tok-${new mongoose.Types.ObjectId()}`,
    expiresAt: new Date(Date.now() + 86400000),
    status: 'submitted',
  });

  const attempt = await Attempt.create({
    organization: org._id,
    exam: exam._id,
    participant: participant._id,
    invitation: invitation._id,
    status: 'graded',
    questionOrder: [mcq._id, shortAnswer._id],
    startedAt: new Date(Date.now() - 60000),
    serverDeadlineAt: new Date(Date.now() + 60000),
    submittedAt: new Date(),
    gradedAt: new Date(),
    score: 1,
    percentage: 50,
    passed: true,
    answers: [
      { question: mcq._id, selectedOptionKey: 'A', isCorrect: false, pointsAwarded: 0 },
      {
        question: shortAnswer._id,
        textAnswer: 'They make energy for the cell.',
        isCorrect: true,
        pointsAwarded: 1,
        aiReasoning: 'The answer correctly identifies energy production, matching the expected answer.',
      },
    ],
  });

  const session = { organizationId: org._id.toString(), participantId: participant._id.toString(), invitationId: invitation._id.toString(), examId: exam._id.toString() };
  return { org, exam, participant, invitation, attempt, session };
}

describe('participant result detail', () => {
  test('breakdown resolves option text and surfaces the AI grading explanation', async () => {
    const { session } = await setupGradedAttempt();
    const result = await attemptService.getParticipantResult(session);

    expect(result.ready).toBe(true);
    expect(result.breakdown).toHaveLength(2);

    const [mcqItem, shortAnswerItem] = result.breakdown;
    expect(mcqItem.yourAnswer).toBe('Nucleus');
    expect(mcqItem.correctAnswer).toBe('Mitochondria');
    expect(mcqItem.pointsPossible).toBe(1);
    expect(mcqItem.explanation).toBeNull();

    expect(shortAnswerItem.yourAnswer).toBe('They make energy for the cell.');
    expect(shortAnswerItem.explanation).toMatch(/energy production/);
  });

  test('breakdown is omitted when showCorrectAnswers is off, even though the score is visible', async () => {
    const { session } = await setupGradedAttempt({ showCorrectAnswers: false });
    const result = await attemptService.getParticipantResult(session);
    expect(result.ready).toBe(true);
    expect(result.breakdown).toBeUndefined();
  });

  test('getParticipantResultForExport throws when the result is not visible yet', async () => {
    const { session } = await setupGradedAttempt({ resultVisibility: 'after_close', examStatus: 'published' });
    await expect(attemptService.getParticipantResultForExport(session)).rejects.toMatchObject({ code: 'RESULT_NOT_READY' });
  });

  test('getParticipantResultForExport resolves participant name and exam title for a visible result', async () => {
    const { session } = await setupGradedAttempt();
    const exported = await attemptService.getParticipantResultForExport(session);
    expect(exported.examTitle).toBe('Safety Exam');
    expect(exported.participantName).toBe('Pat Doe');
    expect(exported.result.ready).toBe(true);
  });

  test('generateResultPdf produces a real PDF stream from the exported data', async () => {
    const { session } = await setupGradedAttempt();
    const exported = await attemptService.getParticipantResultForExport(session);

    const doc = generateResultPdf(exported);
    const chunks = [];
    await new Promise((resolve, reject) => {
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', resolve);
      doc.on('error', reject);
    });
    const buffer = Buffer.concat(chunks);
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
  });
});
