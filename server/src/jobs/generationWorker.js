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

// Mirrors queue.js's STUCK_THRESHOLD_MS (can't import it directly — queue.js
// already depends on this file, so the reverse import would be circular). A
// claim older than this is treated as abandoned: the execution that held it
// almost certainly died mid-flight (e.g. a serverless timeout) rather than
// reaching either the success path or the catch block below, so nothing
// ever reverted it to 'draft'. Without this, that exam could never be
// regenerated again — the self-healing retry would just see 'generating'
// and no-op forever.
const STALE_CLAIM_MS = 90 * 1000;

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

// Only reverts a genuine failure by the execution that actually won the
// claim (status is still 'generating') — a run that lost the claim never
// got this far, so there's nothing here for it to undo.
async function revertClaim(data) {
  const tenant = buildTenant(data);
  await scoped(Exam, tenant).updateOne({ _id: data.examId, status: 'generating' }, { status: 'draft', generationClaimedAt: null })
    .catch((revertErr) => logger.error({ revertErr }, 'Failed to revert exam status after generation failure'));
}

async function notifyGenerationFailed(data, err) {
  if (!data.requesterEmail) return;
  const tenant = buildTenant(data);
  const exam = await scoped(Exam, tenant).findById(data.examId).catch(() => null);
  await emailService.sendGenerationFailedEmail({
    to: data.requesterEmail,
    firstName: data.requesterFirstName || 'there',
    examTitle: exam?.title || 'your exam',
    reason: err.message || 'An unexpected error occurred',
  }).catch((emailErr) => logger.warn({ emailErr }, 'Failed to send generation-failed email'));
}

async function process(job) {
  const { examId, documentId, count, typeMix, difficulty, organizationId, requestedBy, requesterEmail, requesterFirstName } = job.attrs.data;
  const tenant = buildTenant(job.attrs.data);

  // Atomic claim: only one execution of this exam's generation may ever
  // reach the AI call and insert questions. Without this, a double-clicked
  // "Generate" request (two jobs, exam.status still 'draft' for both until
  // this line) or the self-healing stuck-job retry below racing a
  // legitimately slow AI call (see queue.js) would both run to completion
  // and insert two full batches of questions for the same exam. A lost
  // claim means some other execution already owns this exam's generation,
  // so this one exits quietly — it does not touch credits or progress,
  // since exactly one winner is responsible for the reservation's lifecycle.
  // The second $or branch reclaims an abandoned claim (see STALE_CLAIM_MS)
  // rather than leaving the exam stuck at 'generating' forever.
  const claim = await scoped(Exam, tenant).updateOne(
    {
      _id: examId,
      $or: [
        { status: 'draft' },
        { status: 'generating', generationClaimedAt: { $lte: new Date(Date.now() - STALE_CLAIM_MS) } },
      ],
    },
    { status: 'generating', generationClaimedAt: new Date() },
  );
  if (claim.matchedCount === 0) {
    logger.warn({ jobId: job.attrs._id?.toString(), examId }, 'Generation already claimed for this exam — skipping duplicate run');
    return;
  }

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
    { status: 'review', questionCount: allQuestions.length, totalPoints, generationClaimedAt: null },
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
    await revertClaim(job.attrs.data);
    await notifyGenerationFailed(job.attrs.data, err);
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
      await revertClaim(job.attrs.data);
      await notifyGenerationFailed(job.attrs.data, err);
      throw err;
    }
  });
}

module.exports = { runGenerationJobNow, defineGenerationJob, releaseFullReservation, RETRYABLE_STEPS };
