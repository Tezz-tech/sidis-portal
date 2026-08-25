const { Schema, model } = require('mongoose');

const invitationSchema = new Schema(
  {
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    exam: { type: Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
    participant: { type: Schema.Types.ObjectId, ref: 'Participant', required: true },
    token: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ['sent', 'opened', 'started', 'submitted', 'expired'],
      default: 'sent',
    },
    sentAt: { type: Date, default: null },
    openedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

invitationSchema.index({ exam: 1, participant: 1 }, { unique: true });

module.exports = model('Invitation', invitationSchema);
