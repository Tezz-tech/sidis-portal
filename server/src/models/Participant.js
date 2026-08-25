const { Schema, model } = require('mongoose');

const participantSchema = new Schema(
  {
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    externalId: { type: String, default: null, trim: true },
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true },
);

participantSchema.index({ organization: 1, email: 1 }, { unique: true });

module.exports = model('Participant', participantSchema);
