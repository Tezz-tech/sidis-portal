const organizationService = require('../services/organizationService');
const creditService = require('../services/creditService');
const pricingService = require('../services/pricingService');
const platformMetricsService = require('../services/platformMetricsService');

async function listOrganizations(req, res, next) {
  try {
    const orgs = await organizationService.listOrganizations();
    res.json({ organizations: orgs });
  } catch (err) {
    next(err);
  }
}

async function getOrganization(req, res, next) {
  try {
    const org = await organizationService.getOrganization(req.params.id);
    res.json({ organization: org });
  } catch (err) {
    next(err);
  }
}

async function createOrganization(req, res, next) {
  try {
    const org = await organizationService.createOrganization({ ...req.body, createdBy: req.tenant.userId });
    res.status(201).json({ organization: org });
  } catch (err) {
    next(err);
  }
}

async function setOrganizationStatus(req, res, next) {
  try {
    const org = await organizationService.setStatus(req.params.id, req.body.status, req.tenant.userId);
    res.json({ organization: org });
  } catch (err) {
    next(err);
  }
}

async function grantCredits(req, res, next) {
  try {
    const balance = await creditService.grant({
      organizationId: req.params.id,
      amount: req.body.amount,
      description: req.body.description,
      createdBy: req.tenant.userId,
    });
    res.json({ creditBalance: balance });
  } catch (err) {
    next(err);
  }
}

async function getOrganizationLedger(req, res, next) {
  try {
    const ledger = await creditService.getLedger({ organizationId: req.params.id }, req.query);
    res.json(ledger);
  } catch (err) {
    next(err);
  }
}

async function getPricingConfig(req, res, next) {
  try {
    const config = await pricingService.getPricingConfig();
    res.json({ pricing: config });
  } catch (err) {
    next(err);
  }
}

async function updatePricingConfig(req, res, next) {
  try {
    const config = await pricingService.updatePricingConfig(req.body);
    res.json({ pricing: config });
  } catch (err) {
    next(err);
  }
}

async function listPayments(req, res, next) {
  try {
    const payments = await platformMetricsService.listPayments();
    res.json({ payments });
  } catch (err) {
    next(err);
  }
}

async function getMetrics(req, res, next) {
  try {
    const metrics = await platformMetricsService.getMetrics();
    res.json(metrics);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listOrganizations,
  getOrganization,
  createOrganization,
  setOrganizationStatus,
  grantCredits,
  getOrganizationLedger,
  getPricingConfig,
  updatePricingConfig,
  listPayments,
  getMetrics,
};
