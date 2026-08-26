const { Schema, model } = require('mongoose');

const creditTransactionSchema = new Schema(
  {
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    type: {
      type: String,
      enum: ['purchase', 'generation', 'grading', 'refund', 'grant', 'adjustment', 'reservation', 'release'],
      required: true,
    },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    reference: {
      model: { type: String, default: null },
      id: { type: Schema.Types.ObjectId, default: null },
    },
    description: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Append-only ledger: block updates and deletes at the driver level.
creditTransactionSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate', 'deleteOne', 'deleteMany', 'findOneAndDelete'], function blockMutation(next) {
  next(new Error('CreditTransaction records are append-only and cannot be modified or deleted'));
});

module.exports = model('CreditTransaction', creditTransactionSchema);
