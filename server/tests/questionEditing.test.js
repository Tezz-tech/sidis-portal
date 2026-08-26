const mongoose = require('mongoose');
const request = require('supertest');

let app;
let connectDB;
let Organization;
let User;
let Exam;
let Question;
let hashPassword;

const PASSWORD = 'correct-horse-battery-staple';

async function createOrgWithAdmin(name, slugBase) {
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
  ({ Organization, User, Exam, Question } = require('../src/models'));
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

describe('question editing on a live exam', () => {
  test('a published exam still allows adding, editing, and deleting questions', async () => {
    const { org, admin } = await createOrgWithAdmin('Org A', 'org-a');
    const exam = await Exam.create({ organization: org._id, createdBy: admin._id, title: 'Live Exam', status: 'published' });
    const question = await Question.create({
      organization: org._id,
      exam: exam._id,
      order: 0,
      type: 'mcq',
      prompt: 'Original prompt',
      options: [{ key: 'A', text: 'a' }, { key: 'B', text: 'b' }],
      correctOptionKey: 'A',
      points: 1,
    });

    const agent = await loginAs(admin.email);

    const addRes = await agent.post(`/api/exams/${exam._id}/questions`).send({
      type: 'mcq',
      prompt: 'A new question',
      options: [{ key: 'A', text: 'x' }, { key: 'B', text: 'y' }],
      correctOptionKey: 'A',
      points: 1,
    });
    expect(addRes.status).toBe(201);

    const editRes = await agent.patch(`/api/exams/${exam._id}/questions/${question._id}`).send({ prompt: 'Edited prompt' });
    expect(editRes.status).toBe(200);
    expect(editRes.body.question.prompt).toBe('Edited prompt');

    const deleteRes = await agent.delete(`/api/exams/${exam._id}/questions/${question._id}`);
    expect(deleteRes.status).toBe(204);

    const remaining = await Question.countDocuments({ exam: exam._id });
    expect(remaining).toBe(1);
  });

  test('a closed exam behaves the same way', async () => {
    const { org, admin } = await createOrgWithAdmin('Org B', 'org-b');
    const exam = await Exam.create({ organization: org._id, createdBy: admin._id, title: 'Closed Exam', status: 'closed' });
    const question = await Question.create({
      organization: org._id,
      exam: exam._id,
      order: 0,
      type: 'true_false',
      prompt: 'Original',
      options: [{ key: 'A', text: 'True' }, { key: 'B', text: 'False' }],
      correctOptionKey: 'A',
      points: 1,
    });

    const agent = await loginAs(admin.email);
    const editRes = await agent.patch(`/api/exams/${exam._id}/questions/${question._id}`).send({ prompt: 'Edited on a closed exam' });
    expect(editRes.status).toBe(200);
  });
});
