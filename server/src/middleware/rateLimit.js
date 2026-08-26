const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}:${(req.body?.email || '').toLowerCase()}`,
  message: { error: { message: 'Too many sign-in attempts. Try again in 15 minutes.', code: 'RATE_LIMITED' } },
});

const otpRequestLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}:${(req.body?.email || '').toLowerCase()}`,
  message: { error: { message: 'Too many code requests. Try again in 10 minutes.', code: 'RATE_LIMITED' } },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

// Request Workspace creates a real organization + admin account immediately
// (see organizationService.createSelfServeOrganization) — unlike a plain
// lead-capture form, this is worth protecting from being scripted.
const leadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
  message: { error: { message: 'Too many workspace requests from this network. Try again later.', code: 'RATE_LIMITED' } },
});

module.exports = { loginLimiter, otpRequestLimiter, apiLimiter, leadLimiter };
