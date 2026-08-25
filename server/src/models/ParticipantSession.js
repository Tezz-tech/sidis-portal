const { Schema, model } = require('mongoose');

const participantSessionSchema = new Schema({
  invitation: { type: Schema.Types.ObjectId, ref: 'Invitation', required: true, unique: true },
  nonce: { type: String, required: true },
  // A fresh code verification overwrites this document (see otpStore.js),
  // which is what invalidates any session token issued before it.
  expiresAt: { type: Date, required: true, expires: 0 },
});

module.exports = model('ParticipantSession', participantSessionSchema);
