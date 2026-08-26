const { Schema, model } = require('mongoose');

const examSchema = new Schema(
  {
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sourceDocument: { type: Schema.Types.ObjectId, ref: 'Document', default: null },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['draft', 'generating', 'review', 'published', 'closed'], default: 'draft', index: true },
    config: {
      durationMinutes: { type: Number, default: 60 },
      opensAt: { type: Date, default: null },
      closesAt: { type: Date, default: null },
      passMark: { type: Number, default: 50 },
      shuffleQuestions: { type: Boolean, default: true },
      shuffleOptions: { type: Boolean, default: true },
      allowRetakes: { type: Boolean, default: false },
      maxAttempts: { type: Number, default: 1 },
      resultVisibility: {
        type: String,
        enum: ['immediate', 'after_close', 'never'],
        default: 'after_close',
      },
      showCorrectAnswers: { type: Boolean, default: false },
    },
    // Set when generation claims this exam (status -> 'generating'), used
    // only to detect a stale claim if the claiming execution died abnormally
    // (e.g. a serverless timeout) instead of failing cleanly — see the
    // atomic claim in jobs/generationWorker.js.
    generationClaimedAt: { type: Date, default: null },
    questionCount: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 },
    publishedAt: { type: Date, default: null },
    reviewConfirmedAt: { type: Date, default: null },
    reviewConfirmedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

module.exports = model('Exam', examSchema);
