const { scoped } = require('../services/scopedRepo');
const { Exam, Question, Document } = require('../models');
const { generateQuestions } = require('../services/generationService');
const creditService = require('../services/creditService');
const pricingService = require('../services/pricingService');
const emailService = require('../services/emailService');
const logger = require('../config/logger');

// Steps before this point have made no database writes yet, so a stuck job
// at one of these steps (e.g. the Vercel function that was running it got
// killed by its execution time limit) is safe to simply retry from scratch.
// Once a job reaches 'checking' it's about to (or already did) insert
// questions — retrying past that point risks duplicate inserts, so a job
// stuck there instead gets marked failed (with its reservation released)
// rather than re-run; the creator can just click Generate again.
const RETRYABLE_STEPS = new Set(['queued', 'reading', 'understanding', 'writing']);

function buildTenant(data) {
  return { organizationId: data.organizationId, userId: data.requestedBy, role: 'creator' };
}

async function updateProgress(job, progress) {
  job.attrs.data.progress = { ...progress, updatedAt: new Date().toISOString() };
  await job.save();
}

async function releaseFullReservation(data) {
  const pricing = await pricingService.getPricingConfig();
  await creditService.release({
    organizationId: data.organizationId,
    amount: data.count * pricing.creditsPerQuestionGenerated,
    reference: { model: 'Exam', id: data.examId },
    description: 'Released reservation after generation failure',
    createdBy: data.requestedBy,
  }).catch((releaseErr) => logger.error({ releaseErr }, 'Failed to release credits after generation failure'));
}

async function process(job) {
  const { examId, documentId, count, typeMix, difficulty, organizationId, requestedBy, requesterEmail, requesterFirstName } = job.attrs.data;
  const tenant = buildTenant(job.attrs.data);

  await updateProgress(job, { step: 'reading', percent: 10 });

  const doc = await scoped(Document, tenant).findById(documentId).select('+extractedText');
  if (!doc || !doc.extractedText) {
    throw new Error('Source document text is not available');
  }

  await updateProgress(job, { step: 'understanding', percent: 30 });
  await updateProgress(job, { step: 'writing', percent: 50 });

  const questions = await generateQuestions({
    documentText: doc.extractedText,
    count,
    typeMix,
    difficulty,
    organizationId,
  });

  if (questions.length === 0) {
    throw new Error('The AI did not return any usable questions for this document');
  }

  await updateProgress(job, { step: 'checking', percent: 85 });

  const existingCount = await scoped(Question, tenant).countDocuments({ exam: examId });
  await scoped(Question, tenant).insertMany(
    questions.map((q, i) => ({
      exam: examId,
      order: existingCount + i,
      type: q.type,
      prompt: q.prompt,
      options: q.options || [],
      correctOptionKey: q.correctOptionKey || null,
      expectedAnswer: q.expectedAnswer || null,
      gradingGuidance: q.gradingGuidance || null,
      points: q.points || 1,
      source: 'ai',
      sourceExcerpt: q.sourceExcerpt,
    })),
  );

  const allQuestions = await scoped(Question, tenant).find({ exam: examId });
  const totalPoints = allQuestions.reduce((sum, q) => sum + q.points, 0);
  await scoped(Exam, tenant).updateOne(
    { _id: examId },
    { status: 'review', questionCount: allQuestions.length, totalPoints },
  );

  const pricing = await pricingService.getPricingConfig();
  const actualCost = questions.length * pricing.creditsPerQuestionGenerated;
  const reservedCost = count * pricing.creditsPerQuestionGenerated;
  const unused = reservedCost - actualCost;

  await creditService.commitGeneration({
    organizationId,
    amount: actualCost,
    reference: { model: 'Exam', id: examId },
    description: `Generated ${questions.length} questions`,
    createdBy: requestedBy,
  });

  if (unused > 0) {
    await creditService.release({
      organizationId,
      amount: unused,
      reference: { model: 'Exam', id: examId },
      description: `Released unused reservation (requested ${count}, generated ${questions.length})`,
      createdBy: requestedBy,
    });
  }

  const exam = await scoped(Exam, tenant).findById(examId);
  if (requesterEmail) {
    await emailService.sendGenerationCompleteEmail({
      to: requesterEmail,
      firstName: requesterFirstName || 'there',
      examTitle: exam.title,
      questionCount: questions.length,
    });
  }

  job.attrs.data.result = { questionCount: questions.length };
  await updateProgress(job, { step: 'done', percent: 100 });
}

/**
 * Runs a generation job directly — used both by the persistent-worker path
 * (defineGenerationJob, for a Render-style deployment) and by the inline
 * serverless path (see services/generationJobService.js), which calls this
 * the moment a job is created instead of waiting for a separate worker
 * process to pick it up.
 */
async function runGenerationJobNow(job) {
  job.attrs.lastRunAt = new Date();
  await job.save();

  try {
    await process(job);
    job.attrs.lastFinishedAt = new Date();
    await job.save();
  } catch (err) {
    await releaseFullReservation(job.attrs.data);
    job.attrs.failReason = err.message;
    job.attrs.lastFinishedAt = new Date();
    await job.save();
    logger.error({ err, jobId: job.attrs._id?.toString() }, 'Generation job failed');
  }
}

function defineGenerationJob(agenda) {
  agenda.define('generate-questions', { concurrency: 3 }, async (job) => {
    try {
      await process(job);
    } catch (err) {
      await releaseFullReservation(job.attrs.data);
      throw err;
    }
  });
}

module.exports = { runGenerationJobNow, defineGenerationJob, releaseFullReservation, RETRYABLE_STEPS };
