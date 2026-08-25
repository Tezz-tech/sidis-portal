const { z } = require('zod');

const optionSchema = z.object({ key: z.string().min(1), text: z.string().min(1) });

const manualQuestionSchema = z
  .object({
    type: z.enum(['mcq', 'true_false', 'short_answer']),
    prompt: z.string().min(1),
    options: z.array(optionSchema).optional().default([]),
    correctOptionKey: z.string().nullable().optional(),
    expectedAnswer: z.string().nullable().optional(),
    gradingGuidance: z.string().nullable().optional(),
    points: z.number().positive().default(1),
  })
  .superRefine((q, ctx) => {
    if ((q.type === 'mcq' || q.type === 'true_false') && (!q.options || q.options.length < 2)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['options'], message: 'Add at least two options' });
    }
    if ((q.type === 'mcq' || q.type === 'true_false') && !q.correctOptionKey) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['correctOptionKey'], message: 'Choose the correct option' });
    }
    if (q.type === 'short_answer' && !q.expectedAnswer) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['expectedAnswer'], message: 'Provide an expected answer' });
    }
  });

const updateQuestionSchema = z.object({
  type: z.enum(['mcq', 'true_false', 'short_answer']).optional(),
  prompt: z.string().min(1).optional(),
  options: z.array(optionSchema).optional(),
  correctOptionKey: z.string().nullable().optional(),
  expectedAnswer: z.string().nullable().optional(),
  gradingGuidance: z.string().nullable().optional(),
  points: z.number().positive().optional(),
});

const reorderSchema = z.object({
  questionIds: z.array(z.string().min(1)).min(1),
});

module.exports = { manualQuestionSchema, updateQuestionSchema, reorderSchema };
