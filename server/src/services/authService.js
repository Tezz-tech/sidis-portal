const { User, Organization } = require('../models');
const { scoped } = require('./scopedRepo');
const { hashPassword, comparePassword } = require('../utils/password');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { randomToken } = require('../utils/tokens');
const AppError = require('../utils/AppError');
const { sendInviteEmail, sendPasswordResetEmail, sendWelcomeEmail, sendPasswordChangedEmail } = require('./emailService');
const { writeAuditLog } = require('./auditService');

const INVITE_TTL_MS = 72 * 60 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;

/**
 * Staff auth is not yet tenant-scoped at this point in the request lifecycle —
 * the whole point of login is to resolve which tenant a person belongs to. A
 * direct model call here is intentional, not a violation of the scoped-repo
 * rule (which governs post-auth application data access).
 */
async function login({ email, password }) {
  // Email is only unique per-organization (see the compound index on User),
  // not globally — the same address can legitimately belong to an active
  // account at one organization and an invited-but-never-activated one at
  // another. A plain findOne() here isn't guaranteed to land on the right
  // one, and would then reject a perfectly correct password because it
  // happened to fetch the *other* account. Try every active candidate and
  // let the password itself decide which one this login is for.
  const candidates = await User.find({ email: email.toLowerCase(), status: 'active' }).select('+passwordHash');

  let user = null;
  for (const candidate of candidates) {
    if (candidate.passwordHash && await comparePassword(password, candidate.passwordHash)) {
      user = candidate;
      break;
    }
  }
  if (!user) {
    throw new AppError('That email or password is incorrect', 401, 'INVALID_CREDENTIALS');
  }

  user.lastLoginAt = new Date();
  await user.save();

  return issueTokens(user);
}

function issueTokens(user) {
  const claims = {
    userId: user._id.toString(),
    organizationId: user.organization ? user.organization.toString() : null,
    role: user.role,
    tokenVersion: user.refreshTokenVersion,
  };
  return {
    accessToken: signAccessToken(claims),
    refreshToken: signRefreshToken(claims),
    user: toSafeUser(user),
  };
}

async function refresh(refreshToken) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (err) {
    throw new AppError('Your session has expired. Sign in again.', 401, 'TOKEN_EXPIRED');
  }
  const user = await User.findById(payload.userId);
  if (!user || user.status !== 'active' || user.refreshTokenVersion !== payload.tokenVersion) {
    throw new AppError('Your session has expired. Sign in again.', 401, 'TOKEN_EXPIRED');
  }
  return issueTokens(user);
}

async function logout(userId) {
  // Bumping the refresh token version invalidates every outstanding refresh
  // token for this user, not just the one presented.
  await User.updateOne({ _id: userId }, { $inc: { refreshTokenVersion: 1 } });
}

async function inviteStaff({ organizationId, email, firstName, lastName, role, invitedBy }) {
  const existing = await User.findOne({ organization: organizationId, email: email.toLowerCase() });
  if (existing) {
    throw new AppError('Someone with that email is already part of this organization', 409, 'ALREADY_EXISTS');
  }
  const org = await Organization.findById(organizationId);
  if (!org) {
    throw new AppError('Organization not found', 404, 'NOT_FOUND');
  }

  const inviteToken = randomToken();
  const user = await User.create({
    organization: organizationId,
    email: email.toLowerCase(),
    firstName,
    lastName,
    role,
    status: 'invited',
    inviteToken,
    inviteExpiresAt: new Date(Date.now() + INVITE_TTL_MS),
  });

  await sendInviteEmail({ to: user.email, firstName, organizationName: org.name, inviteToken });
  await writeAuditLog({
    organization: organizationId,
    actor: invitedBy,
    action: 'staff.invited',
    targetModel: 'User',
    targetId: user._id,
    metadata: { email: user.email, role },
  });

  return toSafeUser(user);
}

async function resendStaffInvite(tenant, userId, actorId) {
  const user = await scoped(User, tenant).findById(userId);
  if (!user) throw new AppError('Team member not found', 404, 'NOT_FOUND');
  if (user.status !== 'invited') {
    throw new AppError('This person has already accepted their invite', 400, 'ALREADY_ACTIVE');
  }

  const org = await Organization.findById(tenant.organizationId);
  const inviteToken = randomToken();
  user.inviteToken = inviteToken;
  user.inviteExpiresAt = new Date(Date.now() + INVITE_TTL_MS);
  await user.save();

  await sendInviteEmail({ to: user.email, firstName: user.firstName, organizationName: org.name, inviteToken });
  await writeAuditLog({
    organization: tenant.organizationId,
    actor: actorId,
    action: 'staff.invite_resent',
    targetModel: 'User',
    targetId: user._id,
    metadata: { email: user.email },
  });

  return toSafeUser(user);
}

async function acceptInvite({ token, password }) {
  const user = await User.findOne({ inviteToken: token }).select('+inviteToken');
  if (!user || !user.inviteExpiresAt || user.inviteExpiresAt < new Date()) {
    throw new AppError('This invite link is invalid or has expired', 400, 'INVALID_INVITE');
  }
  user.passwordHash = await hashPassword(password);
  user.status = 'active';
  user.inviteToken = null;
  user.inviteExpiresAt = null;
  await user.save();

  const org = user.organization ? await Organization.findById(user.organization) : null;
  await sendWelcomeEmail({ to: user.email, firstName: user.firstName, organizationName: org?.name || 'Sidis' });

  return issueTokens(user);
}

async function forgotPassword(email) {
  const user = await User.findOne({ email: email.toLowerCase(), status: 'active' });
  // Always resolve without revealing whether the email exists.
  if (!user) return;

  const resetToken = randomToken();
  user.passwordResetToken = resetToken;
  user.passwordResetExpiresAt = new Date(Date.now() + RESET_TTL_MS);
  await user.save();

  await sendPasswordResetEmail({ to: user.email, firstName: user.firstName, resetToken });
}

async function resetPassword({ token, password }) {
  const user = await User.findOne({ passwordResetToken: token }).select('+passwordResetToken');
  if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
    throw new AppError('This reset link is invalid or has expired', 400, 'INVALID_RESET_TOKEN');
  }
  user.passwordHash = await hashPassword(password);
  user.passwordResetToken = null;
  user.passwordResetExpiresAt = null;
  user.refreshTokenVersion += 1;
  await user.save();

  await sendPasswordChangedEmail({ to: user.email, firstName: user.firstName });
}

async function getCurrentUser(userId) {
  const user = await User.findById(userId);
  if (!user || user.status !== 'active') {
    throw new AppError('Session invalid', 401, 'UNAUTHENTICATED');
  }
  return toSafeUser(user);
}

function toSafeUser(user) {
  return {
    id: user._id.toString(),
    organizationId: user.organization ? user.organization.toString() : null,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    status: user.status,
  };
}

module.exports = {
  login,
  refresh,
  logout,
  inviteStaff,
  resendStaffInvite,
  acceptInvite,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  toSafeUser,
};
