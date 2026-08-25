const env = require('../config/env');

// Cookie security flags are derived from the actual incoming request's
// protocol (req.secure, which respects the `trust proxy` setting and
// X-Forwarded-Proto) rather than from NODE_ENV. NODE_ENV not being set to
// 'production' on a deploy platform is an easy thing to miss — it already
// broke logging once — and getting this specific check wrong doesn't fail
// loudly, it just silently drops auth cookies on every cross-site request.
// Reading the real protocol removes that failure mode entirely.
//
// Frontend and API commonly end up on different registrable domains (e.g.
// separate *.vercel.app subdomains, which are different "sites" under the
// public suffix list, not just different origins) — that needs
// SameSite=None (which itself requires Secure) or the browser drops the
// cookie on every cross-site request. Only set Domain when it's a real
// shared parent domain; a mismatched Domain (e.g. 'localhost' sent over an
// HTTPS response) makes the browser reject the Set-Cookie header outright.
function baseOptions(req) {
  const secure = req.secure;
  const validCookieDomain = secure && env.COOKIE_DOMAIN && env.COOKIE_DOMAIN !== 'localhost'
    ? env.COOKIE_DOMAIN
    : undefined;

  return {
    httpOnly: true,
    secure,
    sameSite: secure ? 'none' : 'lax',
    ...(validCookieDomain ? { domain: validCookieDomain } : {}),
  };
}

function setStaffAuthCookies(req, res, { accessToken, refreshToken }) {
  const base = baseOptions(req);
  res.cookie('accessToken', accessToken, { ...base, maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, { ...base, maxAge: 7 * 24 * 60 * 60 * 1000, path: '/api/auth/refresh' });
}

function clearStaffAuthCookies(req, res) {
  const base = baseOptions(req);
  res.clearCookie('accessToken', base);
  res.clearCookie('refreshToken', { ...base, path: '/api/auth/refresh' });
}

function setParticipantSessionCookie(req, res, token) {
  res.cookie('participantSession', token, { ...baseOptions(req), maxAge: 3 * 60 * 60 * 1000 });
}

function clearParticipantSessionCookie(req, res) {
  res.clearCookie('participantSession', baseOptions(req));
}

module.exports = {
  setStaffAuthCookies,
  clearStaffAuthCookies,
  setParticipantSessionCookie,
  clearParticipantSessionCookie,
};
