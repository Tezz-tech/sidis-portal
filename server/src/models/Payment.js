const { Schema, model } = require('mongoose');

const paymentSchema = new Schema(
  {
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    paystackReference: { type: String, required: true, unique: true, index: true },
    amountKobo: { type: Number, required: true },
    currency: { type: String, default: 'NGN' },
    creditsPurchased: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
    paidAt: { type: Date, default: null },
    rawWebhookPayload: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true },
);

module.exports = model('Payment', paymentSchema);
