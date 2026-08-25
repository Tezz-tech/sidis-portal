const { Organization, Exam, Attempt, CreditTransaction, Payment } = require('../models');

/**
 * Platform-owner-only aggregate metrics, deliberately unscoped across every
 * organization.
 */
async function getMetrics() {
  const [organizationCount, examCount, attemptCount, totalCreditsIssued, totalRevenueKobo] = await Promise.all([
    Organization.countDocuments(),
    Exam.countDocuments(),
    Attempt.countDocuments(),
    CreditTransaction.aggregate([
      { $match: { type: { $in: ['purchase', 'grant'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then((r) => r[0]?.total || 0),
    Payment.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amountKobo' } } },
    ]).then((r) => r[0]?.total || 0),
  ]);
  return { organizationCount, examCount, attemptCount, totalCreditsIssued, totalRevenueKobo };
}

async function listPayments() {
  return Payment.find().sort({ createdAt: -1 }).limit(200).populate('organization', 'name slug');
}

module.exports = { getMetrics, listPayments };
