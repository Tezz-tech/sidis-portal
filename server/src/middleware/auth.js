const { verifyAccessToken } = require('../utils/jwt');
const { isSessionNonceValid } = require('../utils/otpStore');
const AppError = require('../utils/AppError');

/**
 * Requires a valid staff access token. Attaches req.tenant from the verified
 * token claims only — organizationId is never read from the request body,
 * query string, or URL params for scoping purposes (Layer 1 of tenancy
 * enforcement).
 */
function requireStaffAuth(req, res, next) {
  const token = req.cookies?.accessToken;
  if (!token) {
    return next(new AppError('You must be signed in to do that', 401, 'UNAUTHENTICATED'));
  }
  try {
    const payload = verifyAccessToken(token);
    if (payload.scope === 'participant_attempt') {
      return next(new AppError('You must be signed in to do that', 401, 'UNAUTHENTICATED'));
    }
    req.tenant = {
      organizationId: payload.organizationId || null,
      userId: payload.userId,
      role: payload.role,
    };
    return next();
  } catch (err) {
    return next(new AppError('Your session has expired. Sign in again.', 401, 'TOKEN_EXPIRED'));
  }
}

/**
 * Requires a valid participant attempt session, scoped to exactly one
 * invitation/attempt. Cannot be used to access anything else.
 */
async function requireParticipantAuth(req, res, next) {
  const token = req.cookies?.participantSession;
  if (!token) {
    return next(new AppError('Your session has expired. Request a new code.', 401, 'UNAUTHENTICATED'));
  }
  try {
    const payload = verifyAccessToken(token);
    if (payload.scope !== 'participant_attempt') {
      return next(new AppError('Your session has expired. Request a new code.', 401, 'UNAUTHENTICATED'));
    }
    const nonceValid = await isSessionNonceValid(payload.invitationId, payload.sessionNonce);
    if (!nonceValid) {
      return next(new AppError('Your session has expired. Request a new code.', 401, 'SESSION_SUPERSEDED'));
    }
    req.participantSession = {
      organizationId: payload.organizationId,
      participantId: payload.participantId,
      invitationId: payload.invitationId,
      examId: payload.examId,
    };
    return next();
  } catch (err) {
    return next(new AppError('Your session has expired. Request a new code.', 401, 'TOKEN_EXPIRED'));
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.tenant || !roles.includes(req.tenant.role)) {
      return next(new AppError('You do not have permission to do that', 403, 'FORBIDDEN'));
    }
    return next();
  };
}

/**
 * Platform-owner-only routes have no organization scope at all.
 */
function requirePlatformOwner(req, res, next) {
  if (!req.tenant || req.tenant.role !== 'platform_owner') {
    return next(new AppError('You do not have permission to do that', 403, 'FORBIDDEN'));
  }
  return next();
}

module.exports = {
  requireStaffAuth,
  requireParticipantAuth,
  requireRole,
  requirePlatformOwner,
};
