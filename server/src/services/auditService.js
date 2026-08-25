const { AuditLog } = require('../models');

async function writeAuditLog({ organization = null, actor = null, action, targetModel = null, targetId = null, metadata = {}, ipAddress = null }) {
  await AuditLog.create({ organization, actor, action, targetModel, targetId, metadata, ipAddress });
}

module.exports = { writeAuditLog };
