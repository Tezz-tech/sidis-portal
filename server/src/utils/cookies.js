const env = require('../config/env');

const baseOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  domain: env.NODE_ENV === 'production' ? env.COOKIE_DOMAIN : undefined,
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
