const mongoose = require('mongoose');

let Organization;
let Exam;
let examService;

beforeAll(async () => {
  const connectDB = require('../src/config/db');
  await connectDB();
  ({ Organization, Exam } = require('../src/models'));
  examService = require('../src/services/examService');
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

async function setupPublishedExam() {
  const org = await Organization.create({ name: 'Org', slug: `org-${new mongoose.Types.ObjectId()}` });
  const userId = new mongoose.Types.ObjectId();
  const exam = await Exam.create({
    organization: org._id,
    createdBy: userId,
    title: 'Live Exam',
    status: 'published',
    config: { durationMinutes: 60, resultVisibility: 'after_close' },
  });
  const tenant = { organizationId: org._id.toString(), userId: userId.toString(), role: 'org_admin' };
  return { org, exam, tenant };
}

describe('exam settings lock', () => {
  test('a published exam still allows changing resultVisibility and showCorrectAnswers', async () => {
    const { exam, tenant } = await setupPublishedExam();

    // Mirrors what the client actually sends — the full config object, with
    // only resultVisibility genuinely different from what's stored.
    const fullConfigPayload = {
      ...exam.config.toObject(),
      resultVisibility: 'immediate',
      showCorrectAnswers: true,
    };

    const updated = await examService.updateConfig(tenant, exam._id.toString(), fullConfigPayload);
    expect(updated.config.resultVisibility).toBe('immediate');
    expect(updated.config.showCorrectAnswers).toBe(true);
    expect(updated.config.durationMinutes).toBe(60);
  });

  test('a published exam rejects a genuine change to a locked field like durationMinutes', async () => {
    const { exam, tenant } = await setupPublishedExam();

    const payload = { ...exam.config.toObject(), durationMinutes: 90 };

    await expect(examService.updateConfig(tenant, exam._id.toString(), payload)).rejects.toMatchObject({
      code: 'EXAM_LOCKED',
    });
  });

  test('a draft exam still allows changing any field, as before', async () => {
    const org = await Organization.create({ name: 'Org', slug: `org-${new mongoose.Types.ObjectId()}` });
    const userId = new mongoose.Types.ObjectId();
    const exam = await Exam.create({ organization: org._id, createdBy: userId, title: 'Draft Exam', status: 'draft' });
    const tenant = { organizationId: org._id.toString(), userId: userId.toString(), role: 'org_admin' };

    const updated = await examService.updateConfig(tenant, exam._id.toString(), { durationMinutes: 45, resultVisibility: 'immediate' });
    expect(updated.config.durationMinutes).toBe(45);
    expect(updated.config.resultVisibility).toBe('immediate');
  });
});
