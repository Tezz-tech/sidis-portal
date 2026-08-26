const { Organization, User, Exam, Attempt } = require('../models');
const AppError = require('../utils/AppError');
const { randomToken } = require('../utils/tokens');
const { sendInviteEmail } = require('./emailService');
const { writeAuditLog } = require('./auditService');
const examService = require('./examService');

const INVITE_TTL_MS = 72 * 60 * 60 * 1000;

/**
 * Platform-owner-only operations. These deliberately query across every
 * organization, so they live outside the per-tenant scoped() helper — the
 * platform owner IS the entity allowed to see across tenants.
 */
async function listOrganizations() {
  const orgs = await Organization.find().sort({ createdAt: -1 }).lean();
  const [examCounts, attemptCounts] = await Promise.all([
    Exam.aggregate([{ $group: { _id: '$organization', count: { $sum: 1 } } }]),
    Attempt.aggregate([{ $group: { _id: '$organization', count: { $sum: 1 } } }]),
  ]);
  const examMap = new Map(examCounts.map((e) => [e._id.toString(), e.count]));
  const attemptMap = new Map(attemptCounts.map((a) => [a._id.toString(), a.count]));

  return orgs.map((org) => ({
    ...org,
    examCount: examMap.get(org._id.toString()) || 0,
    attemptCount: attemptMap.get(org._id.toString()) || 0,
  }));
}

async function getOrganization(organizationId) {
  const org = await Organization.findById(organizationId).lean();
  if (!org) throw new AppError('Organization not found', 404, 'NOT_FOUND');
  const [examCount, attemptCount, admins] = await Promise.all([
    Exam.countDocuments({ organization: organizationId }),
    Attempt.countDocuments({ organization: organizationId }),
    User.find({ organization: organizationId, role: 'org_admin' }).lean(),
  ]);
  return { ...org, examCount, attemptCount, admins };
}

function slugify(name) {
  const base = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  return base || 'workspace';
}

async function generateUniqueSlug(name) {
  const base = slugify(name);
  let candidate = base;
  let suffix = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await Organization.exists({ slug: candidate })) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}

/**
 * The public "Request a workspace" form's equivalent of createOrganization —
 * same underlying action (org + invited admin + invite email + audit log),
 * just triggered by an unauthenticated visitor instead of the platform
 * owner, so there's no createdBy actor and no user-chosen slug to validate.
 */
async function createSelfServeOrganization({ name, type, adminEmail, adminFirstName, adminLastName }) {
  const slug = await generateUniqueSlug(name);
  return createOrganization({ name, slug, type, adminEmail, adminFirstName, adminLastName, createdBy: null });
}

async function createOrganization({ name, slug, type, adminEmail, adminFirstName, adminLastName, createdBy }) {
  const existingSlug = await Organization.findOne({ slug });
  if (existingSlug) {
    throw new AppError('That workspace URL is already taken', 409, 'SLUG_TAKEN');
  }

  const org = await Organization.create({ name, slug, type });

  const inviteToken = randomToken();
  const admin = await User.create({
    organization: org._id,
    email: adminEmail.toLowerCase(),
    firstName: adminFirstName,
    lastName: adminLastName,
    role: 'org_admin',
    status: 'invited',
    inviteToken,
    inviteExpiresAt: new Date(Date.now() + INVITE_TTL_MS),
  });

  await sendInviteEmail({ to: admin.email, firstName: adminFirstName, organizationName: org.name, inviteToken });
  await writeAuditLog({
    organization: org._id,
    actor: createdBy,
    action: 'organization.created',
    targetModel: 'Organization',
    targetId: org._id,
    metadata: { name, slug },
  });

  return org.toObject();
}

async function setStatus(organizationId, status, actorId) {
  const org = await Organization.findByIdAndUpdate(organizationId, { status }, { new: true });
  if (!org) throw new AppError('Organization not found', 404, 'NOT_FOUND');
  await writeAuditLog({
    organization: organizationId,
    actor: actorId,
    action: status === 'suspended' ? 'organization.suspended' : 'organization.reactivated',
    targetModel: 'Organization',
    targetId: organizationId,
  });
  return org.toObject();
}

// name/type/logoUrl only — not slug, since that's woven into whatever URLs
// an org has already shared, and not status, which goes through setStatus
// so it stays a distinct, clearly-audited action.
async function updateOrganization(organizationId, { name, type, logoUrl }, actorId) {
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (type !== undefined) updates.type = type;
  if (logoUrl !== undefined) updates.logoUrl = logoUrl;

  const org = await Organization.findByIdAndUpdate(organizationId, updates, { new: true });
  if (!org) throw new AppError('Organization not found', 404, 'NOT_FOUND');
  await writeAuditLog({
    organization: organizationId,
    actor: actorId,
    action: 'organization.updated',
    targetModel: 'Organization',
    targetId: organizationId,
    metadata: updates,
  });
  return org.toObject();
}

/**
 * Everything below is the platform-owner equivalent of what an org_admin
 * can already do for their own org (teamService.js, examService.js) — same
 * operations, just reachable across every tenant instead of the caller's
 * own. Team-member role/status changes and exam listing/closing all reuse
 * the org-scoped functions directly with a constructed tenant context,
 * rather than duplicating that logic here.
 */
async function listOrgTeam(organizationId) {
  return User.find({ organization: organizationId }).sort({ createdAt: 1 });
}

async function updateOrgTeamMemberRole(organizationId, userId, role, actorId) {
  const user = await User.findOneAndUpdate({ _id: userId, organization: organizationId }, { role }, { new: true });
  if (!user) throw new AppError('Team member not found', 404, 'NOT_FOUND');
  await writeAuditLog({
    organization: organizationId,
    actor: actorId,
    action: 'team.role_changed',
    targetModel: 'User',
    targetId: userId,
    metadata: { role, changedByPlatformOwner: true },
  });
  return user;
}

async function updateOrgTeamMemberStatus(organizationId, userId, status, actorId) {
  const user = await User.findOneAndUpdate({ _id: userId, organization: organizationId }, { status }, { new: true });
  if (!user) throw new AppError('Team member not found', 404, 'NOT_FOUND');
  await writeAuditLog({
    organization: organizationId,
    actor: actorId,
    action: status === 'disabled' ? 'team.disabled' : 'team.enabled',
    targetModel: 'User',
    targetId: userId,
    metadata: { changedByPlatformOwner: true },
  });
  return user;
}

async function listOrgExams(organizationId) {
  return Exam.find({ organization: organizationId }).sort({ createdAt: -1 });
}

function platformOwnerTenant(organizationId, actorId) {
  return { organizationId, userId: actorId, role: 'platform_owner' };
}

async function forceCloseExam(organizationId, examId, actorId) {
  const exam = await examService.closeExam(platformOwnerTenant(organizationId, actorId), examId, actorId);
  await writeAuditLog({
    organization: organizationId,
    actor: actorId,
    action: 'exam.force_closed_by_platform_owner',
    targetModel: 'Exam',
    targetId: examId,
  });
  return exam;
}

module.exports = {
  listOrganizations,
  getOrganization,
  createOrganization,
  createSelfServeOrganization,
  setStatus,
  updateOrganization,
  listOrgTeam,
  updateOrgTeamMemberRole,
  updateOrgTeamMemberStatus,
  listOrgExams,
  forceCloseExam,
};
