const { z } = require('zod');

const packSchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(1),
  credits: z.number().int().positive(),
  priceKobo: z.number().int().positive(),
  isActive: z.boolean().default(true),
});

const pricingConfigSchema = z.object({
  creditsPerQuestionGenerated: z.number().positive().optional(),
  creditsPerShortAnswerGraded: z.number().positive().optional(),
  packs: z.array(packSchema).optional(),
});

const initializePurchaseSchema = z.object({
  packId: z.string().min(1),
});

module.exports = { pricingConfigSchema, initializePurchaseSchema };
