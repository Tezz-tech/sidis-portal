const { scoped } = require('./scopedRepo');
const { Exam, Attempt, Organization } = require('../models');

async function getDashboard(tenant) {
  const [org, examsNeedingReview, recentExams, recentAttempts] = await Promise.all([
    Organization.findById(tenant.organizationId).select('creditBalance name'),
    scoped(Exam, tenant).find({ status: 'review' }).sort({ updatedAt: -1 }).limit(10),
    scoped(Exam, tenant).find({}).sort({ updatedAt: -1 }).limit(8),
    scoped(Attempt, tenant).find({ status: { $in: ['submitted', 'graded'] } })
      .populate('participant', 'firstName lastName')
      .populate('exam', 'title')
      .sort({ submittedAt: -1 })
      .limit(10),
  ]);

  return {
    creditBalance: org.creditBalance,
    organizationName: org.name,
    examsNeedingReview,
    recentExams,
    recentAttempts,
  };
}

module.exports = { getDashboard };
