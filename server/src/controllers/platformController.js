const organizationService = require('../services/organizationService');
const creditService = require('../services/creditService');
const pricingService = require('../services/pricingService');
const platformMetricsService = require('../services/platformMetricsService');
const authService = require('../services/authService');
const auditService = require('../services/auditService');
const dataProtectionService = require('../services/dataProtectionService');
const billingService = require('../services/billingService');

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
    await auditService.writeAuditLog({
      organization: req.params.id,
      actor: req.tenant.userId,
      action: 'credit.granted',
      targetModel: 'Organization',
      targetId: req.params.id,
      metadata: { amount: req.body.amount, description: req.body.description, balanceAfter: balance },
    });
    res.json({ creditBalance: balance });
  } catch (err) {
    next(err);
  }
}

async function adjustCredits(req, res, next) {
  try {
    const balance = await creditService.adjust({
      organizationId: req.params.id,
      amount: req.body.amount,
      description: req.body.description,
      createdBy: req.tenant.userId,
    });
    await auditService.writeAuditLog({
      organization: req.params.id,
      actor: req.tenant.userId,
      action: 'credit.adjusted',
      targetModel: 'Organization',
      targetId: req.params.id,
      metadata: { amount: req.body.amount, description: req.body.description, balanceAfter: balance },
    });
    res.json({ creditBalance: balance });
  } catch (err) {
    next(err);
  }
}

async function updateOrganization(req, res, next) {
  try {
    const org = await organizationService.updateOrganization(req.params.id, req.body, req.tenant.userId);
    res.json({ organization: org });
  } catch (err) {
    next(err);
  }
}

async function listOrgTeam(req, res, next) {
  try {
    const users = await organizationService.listOrgTeam(req.params.id);
    res.json({ team: users.map(authService.toSafeUser) });
  } catch (err) {
    next(err);
  }
}

async function updateOrgTeamMemberRole(req, res, next) {
  try {
    const user = await organizationService.updateOrgTeamMemberRole(req.params.id, req.params.userId, req.body.role, req.tenant.userId);
    res.json({ user: authService.toSafeUser(user) });
  } catch (err) {
    next(err);
  }
}

async function updateOrgTeamMemberStatus(req, res, next) {
  try {
    const user = await organizationService.updateOrgTeamMemberStatus(req.params.id, req.params.userId, req.body.status, req.tenant.userId);
    res.json({ user: authService.toSafeUser(user) });
  } catch (err) {
    next(err);
  }
}

async function listOrgExams(req, res, next) {
  try {
    const exams = await organizationService.listOrgExams(req.params.id);
    res.json({ exams });
  } catch (err) {
    next(err);
  }
}

async function forceCloseExam(req, res, next) {
  try {
    const exam = await organizationService.forceCloseExam(req.params.id, req.params.examId, req.tenant.userId);
    res.json({ exam });
  } catch (err) {
    next(err);
  }
}

async function getAuditLog(req, res, next) {
  try {
    const entries = await auditService.listAuditLog({ organization: req.query.organization || undefined, limit: Number(req.query.limit) || undefined });
    res.json({ entries });
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

async function exportOrganizationData(req, res, next) {
  try {
    const data = await dataProtectionService.exportOrganizationData(req.params.id);
    res.setHeader('Content-Disposition', `attachment; filename="organization-${req.params.id}-export.json"`);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function eraseOrganizationData(req, res, next) {
  try {
    await dataProtectionService.eraseOrganizationData(req.params.id, req.tenant.userId, req.body.confirmName);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function refundPayment(req, res, next) {
  try {
    const payment = await billingService.refundPayment(req.params.id, req.tenant.userId);
    res.json({ payment });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listOrganizations,
  getOrganization,
  createOrganization,
  setOrganizationStatus,
  updateOrganization,
  grantCredits,
  adjustCredits,
  getOrganizationLedger,
  listOrgTeam,
  updateOrgTeamMemberRole,
  updateOrgTeamMemberStatus,
  listOrgExams,
  forceCloseExam,
  getPricingConfig,
  updatePricingConfig,
  listPayments,
  getMetrics,
  getAuditLog,
  exportOrganizationData,
  eraseOrganizationData,
  refundPayment,
};
