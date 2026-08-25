const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const pinoHttp = require('pino-http');

const env = require('./config/env');
const logger = require('./config/logger');
const connectDB = require('./config/db');
const { apiLimiter } = require('./middleware/rateLimit');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const webhookRoutes = require('./routes/webhookRoutes');
const routes = require('./routes');

const app = express();

const allowedOrigins = new Set([
  'http://localhost:5173',
  ...env.FRONTEND_URL.split(',').map((o) => o.trim()).filter(Boolean),
]);

app.set('trust proxy', 1);
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // No Origin header means a same-origin request or a non-browser client
      // (curl, the Paystack webhook, server-to-server) — never CORS-checked.
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} is not allowed`));
    },
    credentials: true,
  }),
);
app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/health' } }));

// On a normal long-running process (Render), connectDB() already resolved
// before app.listen() in server.js, so this is a fast no-op check on every
// request. On a serverless platform (Vercel) that may invoke this module
// without ever running that boot sequence, this is what actually establishes
// — and caches across warm invocations — the connection before any route
// touches the database. Without it, Mongoose silently buffers queries and
// they time out after 10s with no useful error.
app.use((req, res, next) => {
  if (req.path === '/health') return next();
  connectDB().then(() => next()).catch(next);
});

// Paystack webhook needs the raw body for signature verification, so it is
// mounted before the JSON body parser applies to everything else.
app.use('/api/webhooks', webhookRoutes);

app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use('/api', apiLimiter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
