const crypto = require('crypto');
const { baseOptions } = require('../utils/cookies');
const AppError = require('../utils/AppError');

const CSRF_COOKIE = 'csrfToken';
const CSRF_HEADER = 'x-csrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Double-submit cookie CSRF defense. Needed because auth cookies use
 * SameSite=None in production (client and API are different registrable
 * domains — see utils/cookies.js) — exactly the setup CSRF exists for.
 *
 * The token itself isn't secret (it's readable by client JS on purpose); the
 * protection comes from a cross-site attacker page being unable to read it
 * (Same-Origin Policy) to put in the header, even though the browser still
 * auto-attaches the cookie. Only enforced once a session cookie is present —
 * login/signup/forgot-password have no session yet, so there's nothing for
 * a forged cross-site request to abuse.
 */
function csrfMiddleware(req, res, next) {
  let token = req.cookies?.[CSRF_COOKIE];
  if (!token) {
    token = crypto.randomBytes(32).toString('hex');
    res.cookie(CSRF_COOKIE, token, { ...baseOptions(req), httpOnly: false, maxAge: 7 * 24 * 60 * 60 * 1000 });
  }

  if (SAFE_METHODS.has(req.method)) return next();

  const hasSession = Boolean(req.cookies?.accessToken || req.cookies?.participantSession);
  if (!hasSession) return next();

  const headerToken = req.get(CSRF_HEADER);
  if (!headerToken || headerToken !== token) {
    return next(new AppError('Your session could not be verified. Refresh the page and try again.', 403, 'CSRF_INVALID'));
  }
  return next();
}

module.exports = csrfMiddleware;
