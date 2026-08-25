const { enqueueGeneration, getGenerationJobStatus } = require('../jobs/queue');
const { runGenerationJobNow } = require('../jobs/generationWorker');
const { runInBackground } = require('../utils/runInBackground');
const { scoped } = require('./scopedRepo');
const { Document } = require('../models');
const examService = require('./examService');
const pricingService = require('./pricingService');
const creditService = require('./creditService');
const authService = require('./authService');
const AppError = require('../utils/AppError');

async function estimateCost(count) {
  const pricing = await pricingService.getPricingConfig();
  return count * pricing.creditsPerQuestionGenerated;
}

async function requestGeneration(tenant, examId, { count, typeMix, difficulty }) {
  const exam = await examService.getExam(tenant, examId);
  if (exam.status !== 'draft') {
    throw new AppError('This exam already has questions. Delete them first or create a new exam.', 400, 'EXAM_NOT_DRAFT');
  }
  if (!exam.sourceDocument) {
    throw new AppError('This exam has no source document', 400, 'NO_SOURCE_DOCUMENT');
  }
  const doc = await scoped(Document, tenant).findById(exam.sourceDocument);
  if (!doc || doc.extractionStatus !== 'done') {
    throw new AppError('This document is not ready yet. Wait for text extraction to finish.', 400, 'DOCUMENT_NOT_READY');
  }

  const cost = await estimateCost(count);
  await creditService.reserve({
    organizationId: tenant.organizationId,
    amount: cost,
    reference: { model: 'Exam', id: examId },
    description: `Reserved for generating ${count} questions`,
    createdBy: tenant.userId,
  });

  const requester = await authService.getCurrentUser(tenant.userId);

  const job = await enqueueGeneration({
    examId,
    documentId: exam.sourceDocument.toString(),
    count,
    typeMix,
    difficulty,
    organizationId: tenant.organizationId,
    requestedBy: tenant.userId,
    requesterEmail: requester.email,
    requesterFirstName: requester.firstName,
  });

  // There is no separate always-on worker process to pick this up — start
  // processing immediately, continuing after this request has responded
  // (via waitUntil on Vercel; awaited normally everywhere else).
  runInBackground(() => runGenerationJobNow(job), 'generation-start');

  return { jobId: job.attrs._id.toString(), estimatedCost: cost };
}

async function getJobStatus(jobId) {
  const status = await getGenerationJobStatus(jobId);
  if (!status) throw new AppError('Generation job not found', 404, 'NOT_FOUND');
  return status;
}

module.exports = { estimateCost, requestGeneration, getJobStatus };
