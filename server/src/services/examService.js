const { scoped } = require('./scopedRepo');
const { Exam, Question, Document } = require('../models');
const AppError = require('../utils/AppError');
const { writeAuditLog } = require('./auditService');

async function createExam(tenant, { sourceDocumentId, title, description }) {
  if (sourceDocumentId) {
    const doc = await scoped(Document, tenant).findById(sourceDocumentId);
    if (!doc) throw new AppError('Document not found', 404, 'NOT_FOUND');
    if (doc.extractionStatus !== 'done') {
      throw new AppError('This document is not ready yet. Wait for text extraction to finish.', 400, 'DOCUMENT_NOT_READY');
    }
  }
  return scoped(Exam, tenant).create({
    createdBy: tenant.userId,
    sourceDocument: sourceDocumentId || null,
    title,
    description: description || '',
    status: 'draft',
  });
}

async function listExams(tenant, { status } = {}) {
  const filter = status ? { status } : {};
  return scoped(Exam, tenant).find(filter).sort({ createdAt: -1 });
}

async function getExam(tenant, id) {
  const exam = await scoped(Exam, tenant).findById(id);
  if (!exam) throw new AppError('Exam not found', 404, 'NOT_FOUND');
  return exam;
}

async function updateConfig(tenant, id, config) {
  const exam = await getExam(tenant, id);
  if (exam.status === 'published' || exam.status === 'closed') {
    throw new AppError('This exam is already live and its settings can no longer be changed', 400, 'EXAM_LOCKED');
  }
  exam.config = { ...exam.config.toObject(), ...config };
  if (config.title) exam.title = config.title;
  await exam.save();
  return exam;
}

async function updateDetails(tenant, id, { title, description }) {
  const exam = await getExam(tenant, id);
  if (exam.status === 'published' || exam.status === 'closed') {
    throw new AppError('This exam is already live and can no longer be edited', 400, 'EXAM_LOCKED');
  }
  if (title !== undefined) exam.title = title;
  if (description !== undefined) exam.description = description;
  await exam.save();
  return exam;
}

async function confirmReview(tenant, id, actorId) {
  const exam = await getExam(tenant, id);
  if (exam.status !== 'review') {
    throw new AppError('This exam has no generated questions waiting for review', 400, 'NOT_IN_REVIEW');
  }
  const questionCount = await scoped(Question, tenant).countDocuments({ exam: id });
  if (questionCount === 0) {
    throw new AppError('Add at least one question before confirming', 400, 'NO_QUESTIONS');
  }
  exam.reviewConfirmedAt = new Date();
  exam.reviewConfirmedBy = actorId;
  await exam.save();

  await writeAuditLog({
    organization: tenant.organizationId,
    actor: actorId,
    action: 'exam.review_confirmed',
    targetModel: 'Exam',
    targetId: id,
  });

  return exam;
}

async function recalculateTotals(tenant, examId) {
  const questions = await scoped(Question, tenant).find({ exam: examId });
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  await scoped(Exam, tenant).updateOne({ _id: examId }, { questionCount: questions.length, totalPoints });
}

async function closeExam(tenant, id, actorId) {
  const exam = await getExam(tenant, id);
  if (exam.status !== 'published') {
    throw new AppError('Only a published exam can be closed', 400, 'NOT_PUBLISHED');
  }
  exam.status = 'closed';
  await exam.save();

  await writeAuditLog({
    organization: tenant.organizationId,
    actor: actorId,
    action: 'exam.closed',
    targetModel: 'Exam',
    targetId: id,
  });

  return exam;
}

module.exports = {
  createExam,
  listExams,
  getExam,
  updateConfig,
  updateDetails,
  confirmReview,
  recalculateTotals,
  closeExam,
};
