const participantAuthService = require('../services/participantAuthService');
const attemptService = require('../services/attemptService');
const gradingService = require('../services/gradingService');
const { setParticipantSessionCookie, clearParticipantSessionCookie } = require('../utils/cookies');

async function getInvite(req, res, next) {
  try {
    const preview = await participantAuthService.getInvitePreview(req.params.token);
    res.json(preview);
  } catch (err) {
    next(err);
  }
}

async function requestCode(req, res, next) {
  try {
    const result = await participantAuthService.requestCode(req.params.token);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function verifyCode(req, res, next) {
  try {
    const sessionToken = await participantAuthService.verifyCode(req.params.token, req.body.code);
    setParticipantSessionCookie(res, sessionToken);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

async function startAttempt(req, res, next) {
  try {
    await attemptService.getOrCreateAttempt(req.participantSession);
    const state = await attemptService.getRunnerState(req.participantSession);
    res.json(state);
  } catch (err) {
    next(err);
  }
}

async function getState(req, res, next) {
  try {
    const state = await attemptService.getRunnerState(req.participantSession);
    res.json(state);
  } catch (err) {
    next(err);
  }
}

async function saveAnswer(req, res, next) {
  try {
    const result = await attemptService.saveAnswer(req.participantSession, req.params.questionId, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function recordIntegrity(req, res, next) {
  try {
    await attemptService.recordIntegrityEvent(req.participantSession, req.body.event);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

async function submit(req, res, next) {
  try {
    const attempt = await gradingService.submitAttempt(req.participantSession);
    res.json({ status: attempt.status });
  } catch (err) {
    next(err);
  }
}

async function getStatus(req, res, next) {
  try {
    const status = await attemptService.getStatus(req.participantSession);
    res.json(status);
  } catch (err) {
    next(err);
  }
}

async function getResult(req, res, next) {
  try {
    const result = await attemptService.getParticipantResult(req.participantSession);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    clearParticipantSessionCookie(res);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getInvite,
  requestCode,
  verifyCode,
  startAttempt,
  getState,
  saveAnswer,
  recordIntegrity,
  submit,
  getStatus,
  getResult,
  logout,
};
