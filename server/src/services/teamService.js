const { scoped } = require('./scopedRepo');
const { User } = require('../models');
const AppError = require('../utils/AppError');
const { writeAuditLog } = require('./auditService');

async function listTeam(tenant) {
  const users = await scoped(User, tenant).find({});
  return users.sort((a, b) => a.createdAt - b.createdAt);
}

async function updateRole(tenant, userId, role, actorId) {
  if (userId === tenant.userId) {
    throw new AppError('You cannot change your own role', 400, 'CANNOT_MODIFY_SELF');
  }
  const user = await scoped(User, tenant).findByIdAndUpdate(userId, { role }, { new: true });
  if (!user) throw new AppError('Team member not found', 404, 'NOT_FOUND');
  await writeAuditLog({
    organization: tenant.organizationId,
    actor: actorId,
    action: 'team.role_changed',
    targetModel: 'User',
    targetId: userId,
    metadata: { role },
  });
  return user;
}

async function setStatus(tenant, userId, status, actorId) {
  if (userId === tenant.userId) {
    throw new AppError('You cannot disable your own account', 400, 'CANNOT_MODIFY_SELF');
  }
  const user = await scoped(User, tenant).findByIdAndUpdate(userId, { status }, { new: true });
  if (!user) throw new AppError('Team member not found', 404, 'NOT_FOUND');
  await writeAuditLog({
    organization: tenant.organizationId,
    actor: actorId,
    action: status === 'disabled' ? 'team.disabled' : 'team.enabled',
    targetModel: 'User',
    targetId: userId,
  });
  return user;
}

module.exports = { listTeam, updateRole, setStatus };
