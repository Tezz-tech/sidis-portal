const { Schema, model } = require('mongoose');

const userSchema = new Schema(
  {
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', default: null, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, default: null },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ['platform_owner', 'org_admin', 'creator'],
      required: true,
    },
    status: { type: String, enum: ['invited', 'active', 'disabled'], default: 'invited' },
    lastLoginAt: { type: Date, default: null },
    inviteToken: { type: String, default: null, select: false },
    inviteExpiresAt: { type: Date, default: null },
    passwordResetToken: { type: String, default: null, select: false },
    passwordResetExpiresAt: { type: Date, default: null },
    refreshTokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// A person's email must be unique within their organization (platform owner has organization: null).
userSchema.index({ organization: 1, email: 1 }, { unique: true });

module.exports = model('User', userSchema);
