const mongoose = require('mongoose');

jest.mock('../src/services/generationService', () => ({
  generateQuestions: jest.fn(),
}));

let Organization;
let Document;
let Exam;
let Question;
let generationWorker;
let generateQuestions;

function fakeJob(data) {
  return {
    attrs: {
      _id: new mongoose.Types.ObjectId(),
      data: { progress: { step: 'queued', percent: 0, updatedAt: new Date().toISOString() }, ...data },
    },
    save: jest.fn().mockResolvedValue(undefined),
  };
}

beforeAll(async () => {
  const connectDB = require('../src/config/db');
  await connectDB();
  ({ Organization, Document, Exam, Question } = require('../src/models'));
  generationWorker = require('../src/jobs/generationWorker');
  ({ generateQuestions } = require('../src/services/generationService'));
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

async function setupExam() {
  const org = await Organization.create({ name: 'Org', slug: `org-${new mongoose.Types.ObjectId()}`, creditBalance: 100 });
  const doc = await Document.create({
    organization: org._id,
    uploadedBy: new mongoose.Types.ObjectId(),
    originalName: 'doc.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 100,
    storageUrl: 'https://example.com/doc.pdf',
    extractedText: 'Some passage text.',
    extractionStatus: 'done',
  });
  const exam = await Exam.create({
    organization: org._id,
    createdBy: new mongoose.Types.ObjectId(),
    sourceDocument: doc._id,
    title: 'Test Exam',
    status: 'draft',
  });
  return { org, doc, exam };
}

function fakeQuestions(count) {
  return Array.from({ length: count }, (_, i) => ({
    type: 'mcq',
    prompt: `Question ${i + 1}`,
    options: [{ key: 'A', text: 'a' }, { key: 'B', text: 'b' }],
    correctOptionKey: 'A',
    points: 1,
    sourceExcerpt: 'excerpt',
  }));
}

function baseJobData({ org, doc, exam }, count) {
  return {
    examId: exam._id.toString(),
    documentId: doc._id.toString(),
    count,
    typeMix: 'mixed',
    difficulty: 'medium',
    organizationId: org._id.toString(),
    requestedBy: new mongoose.Types.ObjectId().toString(),
    requesterEmail: null,
    requesterFirstName: null,
  };
}

describe('generation duplicate-run guard', () => {
  test('two concurrent runs for the same exam only ever insert one batch of questions', async () => {
    const ctx = await setupExam();
    const count = 5;

    generateQuestions.mockImplementation(async () => {
      // A real AI call is slow enough for two invocations to genuinely
      // overlap — without the exam-level claim, both would reach insertMany.
      await new Promise((resolve) => setTimeout(resolve, 50));
      return fakeQuestions(count);
    });

    const data = baseJobData(ctx, count);
    const jobA = fakeJob(data);
    const jobB = fakeJob(data); // same exam — simulates a double-click or a self-healing retry racing the original

    await Promise.all([
      generationWorker.runGenerationJobNow(jobA),
      generationWorker.runGenerationJobNow(jobB),
    ]);

    const questionCount = await Question.countDocuments({ exam: ctx.exam._id });
    expect(questionCount).toBe(count);

    const finalExam = await Exam.findById(ctx.exam._id);
    expect(finalExam.status).toBe('review');
    expect(generateQuestions).toHaveBeenCalledTimes(1);
  });

  test('a lost claim is a silent no-op — no failReason, no reservation touched', async () => {
    const ctx = await setupExam();
    const count = 5;
    generateQuestions.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return fakeQuestions(count);
    });

    const data = baseJobData(ctx, count);
    const jobA = fakeJob(data);
    const jobB = fakeJob(data);

    await Promise.all([
      generationWorker.runGenerationJobNow(jobA),
      generationWorker.runGenerationJobNow(jobB),
    ]);

    const loser = [jobA, jobB].find((j) => !j.attrs.data.result);
    expect(loser).toBeDefined();
    expect(loser.attrs.failReason).toBeUndefined();
  });

  test('a genuine failure reverts the exam to draft so it can be retried', async () => {
    const ctx = await setupExam();
    generateQuestions.mockRejectedValue(new Error('AI service is temporarily unavailable'));

    const data = baseJobData(ctx, 5);
    await generationWorker.runGenerationJobNow(fakeJob(data));

    const finalExam = await Exam.findById(ctx.exam._id);
    expect(finalExam.status).toBe('draft');
    const questionCount = await Question.countDocuments({ exam: ctx.exam._id });
    expect(questionCount).toBe(0);
  });
});
