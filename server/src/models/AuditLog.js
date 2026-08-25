const { Schema, model } = require('mongoose');

const auditLogSchema = new Schema(
  {
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', default: null, index: true },
    actor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    action: { type: String, required: true },
    targetModel: { type: String, default: null },
    targetId: { type: Schema.Types.ObjectId, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

module.exports = model('AuditLog', auditLogSchema);
