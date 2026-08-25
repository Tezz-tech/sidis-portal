const { Schema, model } = require('mongoose');

const otpCodeSchema = new Schema({
  invitation: { type: Schema.Types.ObjectId, ref: 'Invitation', required: true, unique: true },
  code: { type: String, required: true },
  // expires: 0 creates a TTL index that removes the document once the clock
  // passes this date — MongoDB's equivalent of Redis's `SET ... EX`.
  expiresAt: { type: Date, required: true, expires: 0 },
});

module.exports = model('OtpCode', otpCodeSchema);
