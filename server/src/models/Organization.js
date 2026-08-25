const { Schema, model } = require('mongoose');

const organizationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    logoUrl: { type: String, default: null },
    type: { type: String, enum: ['school', 'company', 'other'], default: 'other' },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    creditBalance: { type: Number, default: 0 },
    settings: {
      defaultExamDuration: { type: Number, default: 60 },
      allowRetakes: { type: Boolean, default: false },
      resultVisibility: {
        type: String,
        enum: ['immediate', 'after_close', 'never'],
        default: 'after_close',
      },
    },
  },
  { timestamps: true },
);

module.exports = model('Organization', organizationSchema);
