const dashboardService = require('../services/dashboardService');

async function get(req, res, next) {
  try {
    const dashboard = await dashboardService.getDashboard(req.tenant);
    res.json(dashboard);
  } catch (err) {
    next(err);
  }
}

module.exports = { get };
