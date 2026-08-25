const { Schema, model } = require('mongoose');

const documentSchema = new Schema(
  {
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    storageUrl: { type: String, required: true },
    extractedText: { type: String, default: null, select: false },
    extractionStatus: { type: String, enum: ['pending', 'done', 'failed'], default: 'pending' },
    extractionError: { type: String, default: null },
    charCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = model('Document', documentSchema);
