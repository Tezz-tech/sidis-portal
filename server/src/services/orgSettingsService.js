const { Organization } = require('../models');
const AppError = require('../utils/AppError');

/**
 * Organization has no `organization` field of its own — it IS the tenant
 * boundary — so it is looked up by the id carried in the verified tenant
 * context rather than through scoped().
 */
async function getOrganization(tenant) {
  const org = await Organization.findById(tenant.organizationId);
  if (!org) throw new AppError('Organization not found', 404, 'NOT_FOUND');
  return org;
}

async function updateOrganization(tenant, updates) {
  const org = await Organization.findByIdAndUpdate(tenant.organizationId, updates, { new: true, runValidators: true });
  if (!org) throw new AppError('Organization not found', 404, 'NOT_FOUND');
  return org;
}

module.exports = { getOrganization, updateOrganization };
