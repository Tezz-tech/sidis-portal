const orgSettingsService = require('../services/orgSettingsService');

async function get(req, res, next) {
  try {
    const org = await orgSettingsService.getOrganization(req.tenant);
    res.json({ organization: org });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const org = await orgSettingsService.updateOrganization(req.tenant, req.body);
    res.json({ organization: org });
  } catch (err) {
    next(err);
  }
}

module.exports = { get, update };
