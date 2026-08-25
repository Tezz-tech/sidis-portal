const authService = require('../services/authService');
const { setStaffAuthCookies, clearStaffAuthCookies } = require('../utils/cookies');
const AppError = require('../utils/AppError');

async function login(req, res, next) {
  try {
    const { accessToken, refreshToken, user } = await authService.login(req.body);
    setStaffAuthCookies(res, { accessToken, refreshToken });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) throw new AppError('Your session has expired. Sign in again.', 401, 'TOKEN_EXPIRED');
    const { accessToken, refreshToken, user } = await authService.refresh(token);
    setStaffAuthCookies(res, { accessToken, refreshToken });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    if (req.tenant?.userId) {
      await authService.logout(req.tenant.userId);
    }
    clearStaffAuthCookies(res);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

async function acceptInvite(req, res, next) {
  try {
    const { accessToken, refreshToken, user } = await authService.acceptInvite(req.body);
    setStaffAuthCookies(res, { accessToken, refreshToken });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

async function forgotPassword(req, res, next) {
  try {
    await authService.forgotPassword(req.body.email);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    await authService.resetPassword(req.body);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await authService.getCurrentUser(req.tenant.userId);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, refresh, logout, acceptInvite, forgotPassword, resetPassword, me };
