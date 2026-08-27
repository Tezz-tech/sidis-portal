const { Schema, model } = require('mongoose');

const answerSchema = new Schema(
  {
    question: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
    selectedOptionKey: { type: String, default: null },
    textAnswer: { type: String, default: null },
    isCorrect: { type: Boolean, default: null },
    pointsAwarded: { type: Number, default: 0 },
    aiConfidence: { type: Number, default: null },
    aiReasoning: { type: String, default: null },
    overriddenBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    overrideReason: { type: String, default: null },
    flaggedForReview: { type: Boolean, default: false },
    answeredAt: { type: Date, default: null },
  },
  { _id: false },
);

const attemptSchema = new Schema(
  {
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    exam: { type: Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
    participant: { type: Schema.Types.ObjectId, ref: 'Participant', required: true, index: true },
    invitation: { type: Schema.Types.ObjectId, ref: 'Invitation', required: true, index: true },
    status: {
      type: String,
      enum: ['in_progress', 'submitted', 'graded', 'expired'],
      default: 'in_progress',
      index: true,
    },
    questionOrder: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
    optionOrder: { type: Map, of: [String], default: undefined },
    flaggedQuestions: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
    startedAt: { type: Date, default: Date.now },
    serverDeadlineAt: { type: Date, required: true },
    submittedAt: { type: Date, default: null },
    gradedAt: { type: Date, default: null },
    // Atomic claim (mirrors Exam.generationClaimedAt) so at most one
    // execution of processGradingJob ever reaches the AI call for a given
    // attempt — see gradingService.js. Left set (not cleared) on failure so
    // a stale claim becomes reclaimable after GRADING_STALE_CLAIM_MS.
    gradingClaimedAt: { type: Date, default: null },
    // Set when grading fails terminally, so the participant/staff-facing
    // retry logic stops silently re-attempting the same doomed call forever.
    gradingFailedAt: { type: Date, default: null },
    gradingFailReason: { type: String, default: null },
    answers: [answerSchema],
    score: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    passed: { type: Boolean, default: null },
    integrity: {
      tabSwitches: { type: Number, default: 0 },
      windowBlurs: { type: Number, default: 0 },
      fullscreenExits: { type: Number, default: 0 },
      ipAddress: { type: String, default: null },
      userAgent: { type: String, default: null },
    },
  },
  { timestamps: true },
);

module.exports = model('Attempt', attemptSchema);
