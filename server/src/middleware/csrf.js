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
 * The token itself isn't secret; the protection comes from a cross-site
 * attacker page being unable to learn it, even though the browser still
 * auto-attaches the cookie to a request. Client and API are on different
 * origins here, so `document.cookie` on the client can NEVER read this
 * cookie no matter how it's flagged (that's plain same-origin isolation,
 * nothing to do with SameSite) — the client instead learns the current
 * value from this response header on every response (exposed cross-origin
 * via CORS's exposedHeaders, see app.js), and echoes it back on writes. A
 * forged cross-site request can't read our response headers either, since
 * its origin was never allowed by CORS in the first place — that's what
 * still makes this a real defense, not just a relocated cookie read.
 * Enforced only once a session cookie is present — login/signup/
 * forgot-password have no session yet, so there's nothing for a forged
 * cross-site request to abuse.
 */
function csrfMiddleware(req, res, next) {
  let token = req.cookies?.[CSRF_COOKIE];
  if (!token) {
    token = crypto.randomBytes(32).toString('hex');
    res.cookie(CSRF_COOKIE, token, { ...baseOptions(req), httpOnly: false, maxAge: 7 * 24 * 60 * 60 * 1000 });
  }
  res.setHeader(CSRF_HEADER, token);

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
