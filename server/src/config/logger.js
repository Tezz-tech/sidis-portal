const pino = require('pino');
const env = require('./env');

// No `transport` option here on purpose: pino's pretty-print transport
// spawns a worker thread that does its own dynamic require('pino-pretty') at
// runtime, which is unreliable in bundled/serverless environments (it's what
// crashed the Vercel deployment — see config/logger.js history). Always emit
// plain structured JSON; pipe through pino-pretty as a separate CLI process
// for local dev instead (see the "dev" script in package.json).
const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  redact: ['req.headers.cookie', 'req.headers.authorization', '*.password', '*.passwordHash'],
});

module.exports = logger;
