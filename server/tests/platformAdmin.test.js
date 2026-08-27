const mongoose = require('mongoose');
const request = require('supertest');

let app;
let connectDB;
let Organization;
let User;
let Exam;
let hashPassword;

const PASSWORD = 'correct-horse-battery-staple';

async function createPlatformOwner() {
  const passwordHash = await hashPassword(PASSWORD);
  const email = `owner-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@sidis.test`;
  await User.create({
    organization: null,
    email,
    passwordHash,
    firstName: 'Platform',
    lastName: 'Owner',
    role: 'platform_owner',
    status: 'active',
  });
  return email;
}

async function createOrgWithAdmin(name, slugBase) {
  const slug = `${slugBase}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const org = await Organization.create({ name, slug, type: 'company', creditBalance: 50 });
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

// The app's real CSRF defense (double-submit cookie) requires the
// X-CSRF-Token header on every mutating request once a session exists.
// supertest's agent resends the csrfToken cookie automatically but never
// reads it back into a header the way a browser + our axios interceptor
// does — tests have to do that wiring themselves.
function withCsrf(agent, loginRes) {
  const setCookie = [].concat(loginRes.headers['set-cookie'] || []);
  const match = setCookie.map((c) => c.match(/^csrfToken=([^;]+)/)).find(Boolean);
  const token = match ? match[1] : null;
  if (!token) return agent;
  ['post', 'patch', 'put', 'delete'].forEach((method) => {
    const original = agent[method].bind(agent);
    agent[method] = (...args) => original(...args).set('X-CSRF-Token', token);
  });
  return agent;
}

async function loginAs(email) {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/login').send({ email, password: PASSWORD });
  expect(res.status).toBe(200);
  return withCsrf(agent, res);
}

beforeAll(async () => {
  app = require('../src/app');
  connectDB = require('../src/config/db');
  ({ Organization, User, Exam } = require('../src/models'));
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

describe('platform owner administration', () => {
  test('can list every staff member of an org, not just admins', async () => {
    const ownerEmail = await createPlatformOwner();
    const { org, admin } = await createOrgWithAdmin('Org A', 'org-a');
    await User.create({
      organization: org._id,
      email: 'creator@org-a.test',
      passwordHash: await hashPassword(PASSWORD),
      firstName: 'Cara',
      lastName: 'Creator',
      role: 'creator',
      status: 'active',
    });

    const agent = await loginAs(ownerEmail);
    const res = await agent.get(`/api/platform/organizations/${org._id}/team`);
    expect(res.status).toBe(200);
    expect(res.body.team.map((u) => u.email).sort()).toEqual([admin.email, 'creator@org-a.test'].sort());
  });

  test('can change a staff member role and status', async () => {
    const ownerEmail = await createPlatformOwner();
    const { org } = await createOrgWithAdmin('Org A', 'org-a');
    const creator = await User.create({
      organization: org._id,
      email: 'creator@org-a.test',
      passwordHash: await hashPassword(PASSWORD),
      firstName: 'Cara',
      lastName: 'Creator',
      role: 'creator',
      status: 'active',
    });

    const agent = await loginAs(ownerEmail);
    const roleRes = await agent.patch(`/api/platform/organizations/${org._id}/team/${creator._id}/role`).send({ role: 'org_admin' });
    expect(roleRes.status).toBe(200);
    expect(roleRes.body.user.role).toBe('org_admin');

    const statusRes = await agent.patch(`/api/platform/organizations/${org._id}/team/${creator._id}/status`).send({ status: 'disabled' });
    expect(statusRes.status).toBe(200);
    expect(statusRes.body.user.status).toBe('disabled');
  });

  test('can edit organization details', async () => {
    const ownerEmail = await createPlatformOwner();
    const { org } = await createOrgWithAdmin('Org A', 'org-a');

    const agent = await loginAs(ownerEmail);
    const res = await agent.patch(`/api/platform/organizations/${org._id}`).send({ name: 'Org A Renamed', type: 'school' });
    expect(res.status).toBe(200);
    expect(res.body.organization.name).toBe('Org A Renamed');
    expect(res.body.organization.type).toBe('school');
  });

  test('can adjust an organization balance up or down, still guarded against going negative', async () => {
    const ownerEmail = await createPlatformOwner();
    const { org } = await createOrgWithAdmin('Org A', 'org-a'); // creditBalance: 50

    const agent = await loginAs(ownerEmail);
    const down = await agent.post(`/api/platform/organizations/${org._id}/credits/adjust`).send({ amount: -20, description: 'Correcting a duplicate-generation over-refund' });
    expect(down.status).toBe(200);
    expect(down.body.creditBalance).toBe(30);

    const tooFar = await agent.post(`/api/platform/organizations/${org._id}/credits/adjust`).send({ amount: -1000, description: 'Should fail' });
    expect(tooFar.status).toBe(402);

    const up = await agent.post(`/api/platform/organizations/${org._id}/credits/adjust`).send({ amount: 15, description: 'Correcting the other way' });
    expect(up.status).toBe(200);
    expect(up.body.creditBalance).toBe(45);
  });

  test('can list an org\'s exams and force-close a published one', async () => {
    const ownerEmail = await createPlatformOwner();
    const { org } = await createOrgWithAdmin('Org A', 'org-a');
    const exam = await Exam.create({
      organization: org._id,
      createdBy: new mongoose.Types.ObjectId(),
      title: 'Live Exam',
      status: 'published',
    });

    const agent = await loginAs(ownerEmail);
    const listRes = await agent.get(`/api/platform/organizations/${org._id}/exams`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.exams).toHaveLength(1);

    const closeRes = await agent.post(`/api/platform/organizations/${org._id}/exams/${exam._id}/close`);
    expect(closeRes.status).toBe(200);
    expect(closeRes.body.exam.status).toBe('closed');
  });

  test('actions are recorded in the audit log and visible platform-wide', async () => {
    const ownerEmail = await createPlatformOwner();
    const { org } = await createOrgWithAdmin('Org A', 'org-a');

    const agent = await loginAs(ownerEmail);
    await agent.patch(`/api/platform/organizations/${org._id}`).send({ name: 'Renamed via audit test' });

    const res = await agent.get('/api/platform/audit-log');
    expect(res.status).toBe(200);
    expect(res.body.entries.some((e) => e.action === 'organization.updated')).toBe(true);
  });

  test('a non-owner staff member cannot reach any of these new routes', async () => {
    const { org, admin } = await createOrgWithAdmin('Org A', 'org-a');
    const agent = await loginAs(admin.email);

    const res1 = await agent.get(`/api/platform/organizations/${org._id}/team`);
    expect(res1.status).toBe(403);
    const res2 = await agent.get('/api/platform/audit-log');
    expect(res2.status).toBe(403);
  });
});
