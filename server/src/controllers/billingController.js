const billingService = require('../services/billingService');
const creditService = require('../services/creditService');
const pricingService = require('../services/pricingService');
const authService = require('../services/authService');

async function getPacks(req, res, next) {
  try {
    const pricing = await pricingService.getPricingConfig();
    res.json({ packs: pricing.packs.filter((p) => p.isActive) });
  } catch (err) {
    next(err);
  }
}

async function getRates(req, res, next) {
  try {
    const pricing = await pricingService.getPricingConfig();
    res.json({
      creditsPerQuestionGenerated: pricing.creditsPerQuestionGenerated,
      creditsPerShortAnswerGraded: pricing.creditsPerShortAnswerGraded,
    });
  } catch (err) {
    next(err);
  }
}

async function getBalance(req, res, next) {
  try {
    const creditBalance = await billingService.getBalance(req.tenant);
    res.json({ creditBalance });
  } catch (err) {
    next(err);
  }
}

async function getLedger(req, res, next) {
  try {
    const ledger = await creditService.getLedger(req.tenant, req.query);
    res.json(ledger);
  } catch (err) {
    next(err);
  }
}

async function initializePurchase(req, res, next) {
  try {
    const staff = await authService.getCurrentUser(req.tenant.userId);
    const result = await billingService.initializePurchase(req.tenant, req.body, staff.email);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function confirmPurchase(req, res, next) {
  try {
    const result = await billingService.confirmPurchase(req.tenant, req.body.reference);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { getPacks, getRates, getBalance, getLedger, initializePurchase, confirmPurchase };
