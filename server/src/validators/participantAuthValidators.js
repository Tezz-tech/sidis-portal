const { z } = require('zod');

const verifyCodeSchema = z.object({
  code: z.string().length(6),
});

const saveAnswerSchema = z.object({
  selectedOptionKey: z.string().nullable().optional(),
  textAnswer: z.string().nullable().optional(),
  flaggedForReview: z.boolean().optional(),
});

const integrityEventSchema = z.object({
  event: z.enum(['tab_switch', 'window_blur', 'fullscreen_exit']),
});

module.exports = { verifyCodeSchema, saveAnswerSchema, integrityEventSchema };
