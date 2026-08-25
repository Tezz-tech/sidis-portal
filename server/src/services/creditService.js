const mongoose = require('mongoose');
const { Organization, CreditTransaction } = require('../models');
const AppError = require('../utils/AppError');
const { sendLowCreditEmail } = require('./emailService');
const logger = require('../config/logger');

const LOW_BALANCE_WARNING_RATIO = 0.2;

/**
 * All balance changes go through here so the ledger (CreditTransaction) and
 * the cached balance on Organization never drift apart. Every write is a
 * single atomic findOneAndUpdate guarded by a minimum-balance filter, so two
 * concurrent debits can never push the balance below zero.
 */
async function applyTransaction({ organizationId, type, amount, reference = {}, description, createdBy = null }) {
  const filter = { _id: organizationId };
  if (amount < 0) {
    filter.creditBalance = { $gte: -amount };
  }

  const org = await Organization.findOneAndUpdate(
    filter,
    { $inc: { creditBalance: amount } },
    { new: true },
  );

  if (!org) {
    const current = await Organization.findById(organizationId);
    if (!current) throw new AppError('Organization not found', 404, 'NOT_FOUND');
    throw new AppError(
      `This action needs ${-amount} credits, but only ${current.creditBalance} are available.`,
      402,
      'INSUFFICIENT_CREDITS',
    );
  }

  await CreditTransaction.create({
    organization: organizationId,
    type,
    amount,
    balanceAfter: org.creditBalance,
    reference: { model: reference.model || null, id: reference.id || null },
    description,
    createdBy,
  });

  await maybeWarnLowBalance(org);

  return org.creditBalance;
}

async function maybeWarnLowBalance(org) {
  try {
    const lastGrant = await CreditTransaction.findOne({
      organization: org._id,
      type: { $in: ['purchase', 'grant'] },
    }).sort({ createdAt: -1 });
    const referenceAmount = lastGrant ? lastGrant.amount : null;
    if (!referenceAmount) return;

    const ratio = org.creditBalance / referenceAmount;
    if (org.creditBalance === 0 || ratio <= LOW_BALANCE_WARNING_RATIO) {
      // Best-effort notification; failure here must never block the credit operation.
      const { User } = require('../models');
      const admins = await User.find({ organization: org._id, role: 'org_admin', status: 'active' });
      await Promise.all(
        admins.map((admin) => sendLowCreditEmail({ to: admin.email, organizationName: org.name, balance: org.creditBalance })),
      );
    }
  } catch (err) {
    logger.warn({ err }, 'Failed to evaluate low balance warning');
  }
}

function reserve({ organizationId, amount, reference, description, createdBy }) {
  return applyTransaction({ organizationId, type: 'reservation', amount: -amount, reference, description, createdBy });
}

function release({ organizationId, amount, reference, description, createdBy }) {
  return applyTransaction({ organizationId, type: 'release', amount, reference, description, createdBy });
}

function commitGeneration({ organizationId, amount, reference, description, createdBy }) {
  return applyTransaction({ organizationId, type: 'generation', amount: 0, reference, description, createdBy })
    .then(() => amount);
}

function chargeGrading({ organizationId, amount, reference, description, createdBy }) {
  return applyTransaction({ organizationId, type: 'grading', amount: -amount, reference, description, createdBy });
}

function grant({ organizationId, amount, description, createdBy }) {
  return applyTransaction({ organizationId, type: 'grant', amount, description, createdBy });
}

function purchase({ organizationId, amount, reference, description }) {
  return applyTransaction({ organizationId, type: 'purchase', amount, reference, description });
}

function refund({ organizationId, amount, reference, description, createdBy }) {
  return applyTransaction({ organizationId, type: 'refund', amount, reference, description, createdBy });
}

async function getLedger(tenant, { page = 1, limit = 20 } = {}) {
  const filter = { organization: tenant.organizationId };
  const [entries, total] = await Promise.all([
    CreditTransaction.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    CreditTransaction.countDocuments(filter),
  ]);
  return { entries, total, page, limit };
}

module.exports = {
  reserve,
  release,
  commitGeneration,
  chargeGrading,
  grant,
  purchase,
  refund,
  getLedger,
};
