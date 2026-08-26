const mongoose = require('mongoose');
const request = require('supertest');

let app;
let connectDB;
let Organization;
let User;

beforeAll(async () => {
  app = require('../src/app');
  connectDB = require('../src/config/db');
  ({ Organization, User } = require('../src/models'));
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

describe('public "Request a workspace" self-serve signup', () => {
  test('creates a real organization and an invited admin, same as the platform-owner flow', async () => {
    const res = await request(app).post('/api/public/leads').send({
      organizationName: 'Acme Testing Co',
      firstName: 'Jamie',
      lastName: 'Rivers',
      email: 'jamie@acme-testing.test',
      organizationType: 'company',
    });

    expect(res.status).toBe(201);
    expect(res.body.organizationSlug).toBeTruthy();

    const org = await Organization.findOne({ slug: res.body.organizationSlug });
    expect(org).toBeTruthy();
    expect(org.name).toBe('Acme Testing Co');

    // inviteToken has `select: false` on the User model — must opt in explicitly.
    const admin = await User.findOne({ organization: org._id, email: 'jamie@acme-testing.test' }).select('+inviteToken');
    expect(admin).toBeTruthy();
    expect(admin.role).toBe('org_admin');
    expect(admin.status).toBe('invited');
    expect(admin.inviteToken).toBeTruthy();
  });

  test('two requests with the same organization name get different, unique slugs', async () => {
    const first = await request(app).post('/api/public/leads').send({
      organizationName: 'Duplicate Name Inc',
      firstName: 'A',
      lastName: 'One',
      email: 'a@dup1.test',
    });
    const second = await request(app).post('/api/public/leads').send({
      organizationName: 'Duplicate Name Inc',
      firstName: 'B',
      lastName: 'Two',
      email: 'b@dup2.test',
    });

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(first.body.organizationSlug).not.toBe(second.body.organizationSlug);

    const count = await Organization.countDocuments({ name: 'Duplicate Name Inc' });
    expect(count).toBe(2);
  });

  test('rejects a request missing required fields', async () => {
    const res = await request(app).post('/api/public/leads').send({ organizationName: 'No Contact Co' });
    expect(res.status).toBe(422);
    const orgCount = await Organization.countDocuments({ name: 'No Contact Co' });
    expect(orgCount).toBe(0);
  });
});
