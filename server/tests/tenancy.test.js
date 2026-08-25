const mongoose = require('mongoose');
const request = require('supertest');

let app;
let connectDB;
let Organization;
let User;
let Document;
let Exam;
let Participant;
let hashPassword;

const PASSWORD = 'correct-horse-battery-staple';

async function createOrgWithAdmin(name, slugBase) {
  // Each call gets a unique slug/email, even when tests share a base name —
  // the login rate limiter's in-memory bucket is keyed by email and persists
  // for the life of the test process, so reusing an email across test cases
  // would trip it regardless of the tenancy logic under test.
  const slug = `${slugBase}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const org = await Organization.create({ name, slug, type: 'company' });
  const passwordHash = await hashPassword(PASSWORD);
  const admin = await User.create({
    organization: org._id,
    email: `admin@${slug}.test`,
    passwordHash,
    firstName: 'Admin',
    lastName: name,
    role: 'org_admin',
    status: 'active',
  });
  return { org, admin };
}

async function loginAs(email) {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/login').send({ email, password: PASSWORD });
  expect(res.status).toBe(200);
  return agent;
}

beforeAll(async () => {
  app = require('../src/app');
  connectDB = require('../src/config/db');
  ({ Organization, User, Document, Exam, Participant } = require('../src/models'));
  ({ hashPassword } = require('../src/utils/password'));
  await connectDB();
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

describe('cross-tenant isolation', () => {
  test('org A cannot read org B document by id', async () => {
    const { org: orgA, admin: adminA } = await createOrgWithAdmin('Org A', 'org-a');
    const { org: orgB } = await createOrgWithAdmin('Org B', 'org-b');

    const docB = await Document.create({
      organization: orgB._id,
      uploadedBy: new mongoose.Types.ObjectId(),
      originalName: 'secret.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 100,
      storageUrl: 'https://example.com/secret.pdf',
      extractionStatus: 'done',
      extractedText: 'confidential',
      charCount: 12,
    });

    const agentA = await loginAs(adminA.email);
    const res = await agentA.get(`/api/documents/${docB._id}`);
    expect(res.status).toBe(404);
  });

  test('org A cannot list org B documents through the list endpoint', async () => {
    const { admin: adminA } = await createOrgWithAdmin('Org A', 'org-a');
    const { org: orgB } = await createOrgWithAdmin('Org B', 'org-b');

    await Document.create({
      organization: orgB._id,
      uploadedBy: new mongoose.Types.ObjectId(),
      originalName: 'org-b-only.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 100,
      storageUrl: 'https://example.com/x.pdf',
      extractionStatus: 'done',
      charCount: 12,
    });

    const agentA = await loginAs(adminA.email);
    const res = await agentA.get('/api/documents');
    expect(res.status).toBe(200);
    expect(res.body.documents).toHaveLength(0);
  });

  test('org A cannot update org B exam by id', async () => {
    const { admin: adminA } = await createOrgWithAdmin('Org A', 'org-a');
    const { org: orgB, admin: adminB } = await createOrgWithAdmin('Org B', 'org-b');

    const examB = await Exam.create({
      organization: orgB._id,
      createdBy: adminB._id,
      title: 'Org B secret exam',
      status: 'draft',
    });

    const agentA = await loginAs(adminA.email);
    const res = await agentA.patch(`/api/exams/${examB._id}`).send({ title: 'Hijacked' });
    expect(res.status).toBe(404);

    const stillIntact = await Exam.findById(examB._id);
    expect(stillIntact.title).toBe('Org B secret exam');
  });

  test('org A cannot delete org B participant by id', async () => {
    const { admin: adminA } = await createOrgWithAdmin('Org A', 'org-a');
    const { org: orgB } = await createOrgWithAdmin('Org B', 'org-b');

    const participantB = await Participant.create({
      organization: orgB._id,
      email: 'student@org-b.test',
      firstName: 'Student',
      lastName: 'B',
    });

    const agentA = await loginAs(adminA.email);
    const res = await agentA.delete(`/api/participants/${participantB._id}`);
    expect(res.status).toBe(404);

    const stillExists = await Participant.findById(participantB._id);
    expect(stillExists).not.toBeNull();
  });

  test('org A results export cannot include org B data even for a shared exam id namespace collision', async () => {
    const { admin: adminA } = await createOrgWithAdmin('Org A', 'org-a');
    const { org: orgB, admin: adminB } = await createOrgWithAdmin('Org B', 'org-b');

    const examB = await Exam.create({
      organization: orgB._id,
      createdBy: adminB._id,
      title: 'Org B exam',
      status: 'published',
      questionCount: 1,
      totalPoints: 1,
    });

    const agentA = await loginAs(adminA.email);
    const res = await agentA.get(`/api/exams/${examB._id}/results`);
    expect(res.status).toBe(404);
  });

  test('platform owner routes reject non-owner staff', async () => {
    const { admin: adminA } = await createOrgWithAdmin('Org A', 'org-a');
    const agentA = await loginAs(adminA.email);
    const res = await agentA.get('/api/platform/organizations');
    expect(res.status).toBe(403);
  });
});
