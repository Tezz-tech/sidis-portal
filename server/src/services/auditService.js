const { AuditLog } = require('../models');

async function writeAuditLog({ organization = null, actor = null, action, targetModel = null, targetId = null, metadata = {}, ipAddress = null }) {
  await AuditLog.create({ organization, actor, action, targetModel, targetId, metadata, ipAddress });
}

// Platform-owner-only read of the audit trail — deliberately unscoped (an
// optional organization filter narrows it, but the default view spans every
// tenant, same rationale as organizationService's cross-tenant queries).
async function listAuditLog({ organization, limit = 100 } = {}) {
  const filter = organization ? { organization } : {};
  return AuditLog.find(filter)
    .sort({ createdAt: -1 })
    .limit(Math.min(limit, 500))
    .populate('actor', 'firstName lastName email role')
    .populate('organization', 'name slug');
}

module.exports = { writeAuditLog, listAuditLog };
