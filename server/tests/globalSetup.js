const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async function globalSetup() {
  const mongod = await MongoMemoryServer.create({
    instance: { launchTimeout: 60000 },
  });
  global.__MONGOD__ = mongod;

  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = mongod.getUri();
  process.env.JWT_ACCESS_SECRET = 'test-access-secret-'.repeat(3);
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-'.repeat(3);
  process.env.FRONTEND_URL = 'http://localhost:5173';
  process.env.COOKIE_DOMAIN = 'localhost';
};
