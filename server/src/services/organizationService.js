const { Organization, User, Exam, Attempt } = require('../models');
const AppError = require('../utils/AppError');
const { randomToken } = require('../utils/tokens');
const { sendInviteEmail } = require('./emailService');
const { writeAuditLog } = require('./auditService');

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

module.exports = { listOrganizations, getOrganization, createOrganization, setStatus };
