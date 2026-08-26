const { scoped } = require('./scopedRepo');
const { Question, Exam, Document } = require('../models');
const AppError = require('../utils/AppError');
const examService = require('./examService');
const { callGemini } = require('./aiClient');

// Question content stays editable regardless of exam status (including
// published/closed) — a creator managing a live exam needs to be able to
// fix or remove a bad question, not just view it. This only fetches the
// exam (still enforcing tenant scoping via examService.getExam); it no
// longer blocks based on status.
async function assertEditable(tenant, examId) {
  return examService.getExam(tenant, examId);
}

async function listQuestions(tenant, examId) {
  await examService.getExam(tenant, examId);
  return scoped(Question, tenant).find({ exam: examId }).sort({ order: 1 });
}

async function addManualQuestion(tenant, examId, data) {
  const exam = await assertEditable(tenant, examId);
  const count = await scoped(Question, tenant).countDocuments({ exam: examId });
  const question = await scoped(Question, tenant).create({
    exam: examId,
    order: count,
    source: 'manual',
    ...data,
  });
  if (exam.status === 'draft') {
    await scoped(Exam, tenant).updateOne({ _id: examId }, { status: 'review' });
  }
  await examService.recalculateTotals(tenant, examId);
  return question;
}

async function updateQuestion(tenant, examId, questionId, updates) {
  await assertEditable(tenant, examId);
  const question = await scoped(Question, tenant).findByIdAndUpdate(
    questionId,
    { ...updates, source: updates.source === 'ai' ? 'ai_edited' : updates.source, exam: undefined },
    { new: true, runValidators: true },
  );
  if (!question) throw new AppError('Question not found', 404, 'NOT_FOUND');
  await examService.recalculateTotals(tenant, examId);
  return question;
}

async function deleteQuestion(tenant, examId, questionId) {
  await assertEditable(tenant, examId);
  const result = await scoped(Question, tenant).deleteOne({ _id: questionId, exam: examId });
  if (result.deletedCount === 0) throw new AppError('Question not found', 404, 'NOT_FOUND');
  await examService.recalculateTotals(tenant, examId);
}

async function reorderQuestions(tenant, examId, orderedQuestionIds) {
  await assertEditable(tenant, examId);
  await Promise.all(
    orderedQuestionIds.map((questionId, index) => scoped(Question, tenant).updateOne({ _id: questionId, exam: examId }, { order: index })),
  );
  return listQuestions(tenant, examId);
}

async function regenerateQuestion(tenant, examId, questionId) {
  await assertEditable(tenant, examId);
  const [exam, existing] = await Promise.all([
    examService.getExam(tenant, examId),
    scoped(Question, tenant).findById(questionId),
  ]);
  if (!existing) throw new AppError('Question not found', 404, 'NOT_FOUND');
  if (!exam.sourceDocument) {
    throw new AppError('This exam has no source document to regenerate from', 400, 'NO_SOURCE_DOCUMENT');
  }

  const doc = await scoped(Document, tenant).findById(exam.sourceDocument).select('+extractedText');
  if (!doc || !doc.extractedText) {
    throw new AppError('The source document text is not available', 400, 'NO_SOURCE_TEXT');
  }

  const others = await scoped(Question, tenant).find({ exam: examId, _id: { $ne: questionId } });

  const system = `You write a single replacement exam question for an assessment platform, drawn strictly from the passage given. It must be answerable from the passage alone, never about document formatting or metadata, and must not duplicate the existing questions listed. Output strict JSON only, matching: {"type":"mcq|true_false|short_answer","prompt":"...","options":[{"key":"A","text":"..."}],"correctOptionKey":"A","expectedAnswer":null,"gradingGuidance":null,"points":1,"sourceExcerpt":"..."}`;
  const userPrompt = `Passage:
"""
${doc.extractedText.slice(0, 60000)}
"""

Existing questions to avoid duplicating:
${others.map((q) => `- ${q.prompt}`).join('\n') || '(none)'}

Write one replacement question of type "${existing.type}". Return JSON only.`;

  const raw = await callGemini({
    systemInstruction: system,
    prompt: userPrompt,
    // See the matching comment in generationService.js — headroom above the
    // visible-output estimate for the rotated models' invisible "thinking".
    maxOutputTokens: 4096,
    organizationId: tenant.organizationId,
    label: 'question_regenerate',
  });

  let parsed;
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
  } catch (err) {
    throw new AppError('The AI returned a response we could not read. Try again.', 502, 'AI_INVALID_JSON');
  }

  existing.type = parsed.type || existing.type;
  existing.prompt = parsed.prompt;
  existing.options = parsed.options || [];
  existing.correctOptionKey = parsed.correctOptionKey || null;
  existing.expectedAnswer = parsed.expectedAnswer || null;
  existing.gradingGuidance = parsed.gradingGuidance || null;
  existing.points = parsed.points || existing.points;
  existing.source = 'ai';
  existing.sourceExcerpt = parsed.sourceExcerpt;
  await existing.save();

  return existing;
}

module.exports = {
  listQuestions,
  addManualQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
  regenerateQuestion,
};
