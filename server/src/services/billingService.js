const { Payment, Organization } = require('../models');
const { scoped } = require('./scopedRepo');
const paystackService = require('./paystackService');
const creditService = require('./creditService');
const pricingService = require('./pricingService');
const emailService = require('./emailService');
const { writeAuditLog } = require('./auditService');
const AppError = require('../utils/AppError');
const { randomToken } = require('../utils/tokens');
const logger = require('../config/logger');

async function initializePurchase(tenant, { packId }, staffEmail) {
  const pricing = await pricingService.getPricingConfig();
  const pack = pricing.packs.id(packId);
  if (!pack || !pack.isActive) {
    throw new AppError('That credit pack is not available', 400, 'INVALID_PACK');
  }

  const reference = `sidis_${randomToken(12)}`;
  await scoped(Payment, tenant).create({
    paystackReference: reference,
    amountKobo: pack.priceKobo,
    currency: 'NGN',
    creditsPurchased: pack.credits,
    status: 'pending',
  });

  const tx = await paystackService.initializeTransaction({
    email: staffEmail,
    amountKobo: pack.priceKobo,
    reference,
    metadata: { organizationId: tenant.organizationId, packId, credits: pack.credits },
  });

  return { authorizationUrl: tx.authorization_url, reference };
}

/**
 * The webhook is the source of truth for crediting an account — never the
 * client-side callback. Verifies against the Paystack API (not just the
 * signed payload) before crediting, and is idempotent on paystackReference so
 * a replayed webhook can never credit twice.
 */
async function handleChargeSuccess(reference) {
  const payment = await Payment.findOne({ paystackReference: reference });
  if (!payment) {
    logger.warn({ reference }, 'Webhook for unknown payment reference');
    return;
  }
  if (payment.status === 'success') {
    return; // already processed — idempotent no-op
  }

  const verified = await paystackService.verifyTransaction(reference);
  if (verified.status !== 'success') {
    payment.status = 'failed';
    payment.rawWebhookPayload = verified;
    await payment.save();
    return;
  }

  payment.status = 'success';
  payment.paidAt = new Date(verified.paid_at || Date.now());
  payment.rawWebhookPayload = verified;
  await payment.save();

  await creditService.purchase({
    organizationId: payment.organization,
    amount: payment.creditsPurchased,
    reference: { model: 'Payment', id: payment._id },
    description: `Purchased ${payment.creditsPurchased} credits`,
  });

  const org = await Organization.findById(payment.organization);
  const { User } = require('../models');
  const admins = await User.find({ organization: payment.organization, role: 'org_admin', status: 'active' });
  await Promise.all(
    admins.map((admin) => emailService.sendReceiptEmail({
      to: admin.email,
      organizationName: org.name,
      credits: payment.creditsPurchased,
      amountKobo: payment.amountKobo,
      reference,
    })),
  );
}

/**
 * Called when the browser lands back on the billing callback page after
 * checkout. The webhook is still the primary path — this exists because a
 * webhook can be delayed, misconfigured, or simply never arrive (Paystack's
 * webhook URL has to be set up separately in their dashboard), and a
 * customer's payment succeeding shouldn't depend on that being right. Safe
 * to call unconditionally: it re-verifies against the Paystack API itself
 * before crediting anything, and handleChargeSuccess is idempotent, so if
 * the webhook *does* also fire — before or after this — nothing double-credits.
 */
async function confirmPurchase(tenant, reference) {
  const payment = await scoped(Payment, tenant).findOne({ paystackReference: reference });
  if (!payment) {
    throw new AppError('We could not find that payment', 404, 'NOT_FOUND');
  }
  if (payment.status === 'pending') {
    await handleChargeSuccess(reference);
  }
  const [refreshed, org] = await Promise.all([
    scoped(Payment, tenant).findById(payment._id),
    Organization.findById(tenant.organizationId).select('creditBalance'),
  ]);
  return {
    status: refreshed.status,
    creditsPurchased: refreshed.creditsPurchased,
    creditBalance: org.creditBalance,
  };
}

async function getBalance(tenant) {
  const org = await Organization.findById(tenant.organizationId).select('creditBalance');
  return org.creditBalance;
}

/**
 * Reverses a payment's credits on the internal ledger only — does not call
 * Paystack to reverse the actual charge (no such integration exists yet).
 * Blocked by creditService's own balance guard if the org has already spent
 * below what would need to be clawed back, surfacing a clear 402 rather
 * than allowing the balance to go negative.
 */
async function refundPayment(paymentId, actorId) {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new AppError('Payment not found', 404, 'NOT_FOUND');
  if (payment.status !== 'success') {
    throw new AppError('Only a successful payment can be refunded', 400, 'INVALID_STATE');
  }
  if (payment.refundedAt) {
    throw new AppError('This payment has already been refunded', 400, 'ALREADY_REFUNDED');
  }

  await creditService.refund({
    organizationId: payment.organization,
    amount: -payment.creditsPurchased,
    reference: { model: 'Payment', id: payment._id },
    description: `Refunded ${payment.creditsPurchased} credits for payment ${payment.paystackReference}`,
    createdBy: actorId,
  });

  payment.refundedAt = new Date();
  await payment.save();

  await writeAuditLog({
    organization: payment.organization,
    actor: actorId,
    action: 'payment.refunded',
    targetModel: 'Payment',
    targetId: payment._id,
    metadata: { creditsReclaimed: payment.creditsPurchased, paystackReference: payment.paystackReference },
  });

  return payment;
}

module.exports = { initializePurchase, handleChargeSuccess, confirmPurchase, getBalance, refundPayment };
