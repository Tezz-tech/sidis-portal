const mongoose = require('mongoose');
const request = require('supertest');

let app;
let connectDB;
let Organization;
let User;
let hashPassword;

const PASSWORD = 'correct-horse-battery-staple';

beforeAll(async () => {
  app = require('../src/app');
  connectDB = require('../src/config/db');
  ({ Organization, User } = require('../src/models'));
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

describe('login', () => {
  test('succeeds with the correct email and password', async () => {
    const org = await Organization.create({ name: 'Org', slug: `org-${new mongoose.Types.ObjectId()}` });
    await User.create({
      organization: org._id,
      email: 'admin@org.test',
      passwordHash: await hashPassword(PASSWORD),
      firstName: 'Admin',
      lastName: 'Person',
      role: 'org_admin',
      status: 'active',
    });

    const res = await request(app).post('/api/auth/login').send({ email: 'admin@org.test', password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('admin@org.test');
  });

  // The same email is only unique per-organization (see the compound index
  // on User), not globally — a person can be an active member of one
  // organization and separately have an unrelated invited-but-never-
  // activated account at another. A naive findOne({ email }) can land on
  // either record; login must find the one whose password actually
  // matches rather than failing just because it fetched the other one.
  test('logs into the correct organization when the same email exists at another org with no password set', async () => {
    const olderOrg = await Organization.create({ name: 'Older Org', slug: `older-${new mongoose.Types.ObjectId()}` });
    const newerOrg = await Organization.create({ name: 'Newer Org', slug: `newer-${new mongoose.Types.ObjectId()}` });

    // Older, still-invited account for the same email — no password set yet.
    await User.create({
      organization: olderOrg._id,
      email: 'shared@example.test',
      firstName: 'Shared',
      lastName: 'Person',
      role: 'creator',
      status: 'invited',
      inviteToken: 'some-token',
      inviteExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    // Newer, active account for the same email at a different org.
    await User.create({
      organization: newerOrg._id,
      email: 'shared@example.test',
      passwordHash: await hashPassword(PASSWORD),
      firstName: 'Shared',
      lastName: 'Person',
      role: 'org_admin',
      status: 'active',
    });

    const res = await request(app).post('/api/auth/login').send({ email: 'shared@example.test', password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.user.organizationId).toBe(newerOrg._id.toString());
  });

  test('rejects an incorrect password', async () => {
    const org = await Organization.create({ name: 'Org', slug: `org-${new mongoose.Types.ObjectId()}` });
    await User.create({
      organization: org._id,
      email: 'admin2@org.test',
      passwordHash: await hashPassword(PASSWORD),
      firstName: 'Admin',
      lastName: 'Person',
      role: 'org_admin',
      status: 'active',
    });

    const res = await request(app).post('/api/auth/login').send({ email: 'admin2@org.test', password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  test('rejects a still-invited account with no password set', async () => {
    const org = await Organization.create({ name: 'Org', slug: `org-${new mongoose.Types.ObjectId()}` });
    await User.create({
      organization: org._id,
      email: 'pending@org.test',
      firstName: 'Pending',
      lastName: 'Person',
      role: 'creator',
      status: 'invited',
      inviteToken: 'tok',
      inviteExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    const res = await request(app).post('/api/auth/login').send({ email: 'pending@org.test', password: 'anything' });
    expect(res.status).toBe(401);
  });
});
