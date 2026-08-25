const { Schema, model } = require('mongoose');

const packSchema = new Schema(
  {
    name: { type: String, required: true },
    credits: { type: Number, required: true },
    priceKobo: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { _id: true },
);

const pricingConfigSchema = new Schema(
  {
    creditsPerQuestionGenerated: { type: Number, default: 1 },
    creditsPerShortAnswerGraded: { type: Number, default: 1 },
    packs: [packSchema],
  },
  { timestamps: true },
);

pricingConfigSchema.statics.getSingleton = async function getSingleton() {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({
      creditsPerQuestionGenerated: 1,
      creditsPerShortAnswerGraded: 1,
      packs: [
        { name: 'Starter', credits: 100, priceKobo: 500000, isActive: true },
        { name: 'Growth', credits: 500, priceKobo: 2000000, isActive: true },
        { name: 'Scale', credits: 2000, priceKobo: 7000000, isActive: true },
      ],
    });
  }
  return config;
};

module.exports = model('PricingConfig', pricingConfigSchema);
