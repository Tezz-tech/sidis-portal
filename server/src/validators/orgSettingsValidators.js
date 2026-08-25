const { z } = require('zod');

const updateOrgSettingsSchema = z.object({
  name: z.string().min(1).optional(),
  logoUrl: z.string().url().nullable().optional(),
  settings: z
    .object({
      defaultExamDuration: z.number().int().positive().optional(),
      allowRetakes: z.boolean().optional(),
      resultVisibility: z.enum(['immediate', 'after_close', 'never']).optional(),
    })
    .optional(),
});

module.exports = { updateOrgSettingsSchema };
