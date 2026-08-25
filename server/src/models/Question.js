const { Schema, model } = require('mongoose');

const optionSchema = new Schema(
  {
    key: { type: String, required: true },
    text: { type: String, required: true },
  },
  { _id: false },
);

const questionSchema = new Schema(
  {
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    exam: { type: Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
    order: { type: Number, required: true },
    type: { type: String, enum: ['mcq', 'true_false', 'short_answer'], required: true },
    prompt: { type: String, required: true },
    options: [optionSchema],
    correctOptionKey: { type: String, default: null },
    expectedAnswer: { type: String, default: null },
    gradingGuidance: { type: String, default: null },
    points: { type: Number, default: 1 },
    source: { type: String, enum: ['ai', 'manual', 'ai_edited'], default: 'manual' },
    sourceExcerpt: { type: String, default: null },
  },
  { timestamps: true },
);

questionSchema.index({ exam: 1, order: 1 });

module.exports = model('Question', questionSchema);
