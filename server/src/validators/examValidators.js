const { z } = require('zod');

const createExamSchema = z.object({
  sourceDocumentId: z.string().min(1).optional(),
  title: z.string().min(1),
  description: z.string().optional(),
});

const updateExamDetailsSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
});

const updateExamConfigSchema = z.object({
  durationMinutes: z.number().int().positive().optional(),
  opensAt: z.coerce.date().nullable().optional(),
  closesAt: z.coerce.date().nullable().optional(),
  passMark: z.number().min(0).max(100).optional(),
  shuffleQuestions: z.boolean().optional(),
  shuffleOptions: z.boolean().optional(),
  allowRetakes: z.boolean().optional(),
  maxAttempts: z.number().int().positive().optional(),
  resultVisibility: z.enum(['immediate', 'after_close', 'never']).optional(),
  showCorrectAnswers: z.boolean().optional(),
});

const generateQuestionsSchema = z.object({
  count: z.number().int().min(5).max(100),
  typeMix: z.enum(['mixed', 'mcq', 'true_false', 'short_answer']).default('mixed'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
});

module.exports = {
  createExamSchema,
  updateExamDetailsSchema,
  updateExamConfigSchema,
  generateQuestionsSchema,
};
