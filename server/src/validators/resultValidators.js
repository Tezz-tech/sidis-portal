const { z } = require('zod');

const overrideScoreSchema = z.object({
  questionId: z.string().min(1),
  pointsAwarded: z.number().min(0),
  reason: z.string().min(1),
});

module.exports = { overrideScoreSchema };
