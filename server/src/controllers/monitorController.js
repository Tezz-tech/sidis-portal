const monitorService = require('../services/monitorService');

async function getLiveMonitor(req, res, next) {
  try {
    const rows = await monitorService.getLiveMonitor(req.tenant, req.params.id);
    res.json({ rows });
  } catch (err) {
    next(err);
  }
}

module.exports = { getLiveMonitor };
