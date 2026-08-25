const pino = require('pino');
const env = require('./env');

const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: env.NODE_ENV === 'development'
    ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } }
    : undefined,
  redact: ['req.headers.cookie', 'req.headers.authorization', '*.password', '*.passwordHash'],
});

module.exports = logger;
