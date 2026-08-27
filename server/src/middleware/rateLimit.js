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

// Verifying a 6-digit OTP is a brute-forceable action (1,000,000 possible
// codes) — tighter than the request limiter above, since guessing the code
// itself, not requesting more of them, is the direct risk here.
const otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}:${req.params?.token || ''}`,
  message: { error: { message: 'Too many attempts. Request a new code and try again.', code: 'RATE_LIMITED' } },
});

// Shared by /forgot-password (keyed by the email requested) and
// /reset-password (no email in that body — keyed by the reset token being
// attempted instead, so brute-forcing one token doesn't share a budget with
// every other reset attempt from the same IP).
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}:${(req.body?.email || req.body?.token || '').toLowerCase()}`,
  message: { error: { message: 'Too many attempts. Try again in 15 minutes.', code: 'RATE_LIMITED' } },
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

module.exports = { loginLimiter, otpRequestLimiter, otpVerifyLimiter, passwordResetLimiter, apiLimiter, leadLimiter };
