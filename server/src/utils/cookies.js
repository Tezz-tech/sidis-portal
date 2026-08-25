const env = require('../config/env');

// Frontend and API commonly end up on different registrable domains (e.g.
// separate *.vercel.app subdomains, which are different "sites" under the
// public suffix list, not just different origins) — that needs SameSite=None
// (which itself requires Secure) or the browser drops the cookie on every
// cross-site request. Only set Domain when it's a real shared parent domain;
// a mismatched Domain (e.g. 'localhost' sent over a production HTTPS
// response) makes the browser reject the Set-Cookie header outright.
const isProduction = env.NODE_ENV === 'production';
const validCookieDomain = isProduction && env.COOKIE_DOMAIN && env.COOKIE_DOMAIN !== 'localhost'
  ? env.COOKIE_DOMAIN
  : undefined;

const baseOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  ...(validCookieDomain ? { domain: validCookieDomain } : {}),
};

function setStaffAuthCookies(res, { accessToken, refreshToken }) {
  res.cookie('accessToken', accessToken, { ...baseOptions, maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, { ...baseOptions, maxAge: 7 * 24 * 60 * 60 * 1000, path: '/api/auth/refresh' });
}

function clearStaffAuthCookies(res) {
  res.clearCookie('accessToken', baseOptions);
  res.clearCookie('refreshToken', { ...baseOptions, path: '/api/auth/refresh' });
}

function setParticipantSessionCookie(res, token) {
  res.cookie('participantSession', token, { ...baseOptions, maxAge: 3 * 60 * 60 * 1000 });
}

function clearParticipantSessionCookie(res) {
  res.clearCookie('participantSession', baseOptions);
}

module.exports = {
  setStaffAuthCookies,
  clearStaffAuthCookies,
  setParticipantSessionCookie,
  clearParticipantSessionCookie,
};
