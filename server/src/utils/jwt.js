const jwt = require('jsonwebtoken');
const env = require('../config/env');

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '7d';
const PARTICIPANT_SESSION_TTL = '3h';

function signAccessToken(payload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_TTL });
}

function signParticipantToken(payload) {
  // Signed with the access secret but carries a distinct `scope` claim so it can
  // never be mistaken for (or reused as) a staff access token.
  return jwt.sign({ ...payload, scope: 'participant_attempt' }, env.JWT_ACCESS_SECRET, {
    expiresIn: PARTICIPANT_SESSION_TTL,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  signParticipantToken,
  verifyAccessToken,
  verifyRefreshToken,
};
