const { z } = require('zod');

const updateRoleSchema = z.object({
  role: z.enum(['org_admin', 'creator']),
});

const updateStatusSchema = z.object({
  status: z.enum(['active', 'disabled']),
});

module.exports = { updateRoleSchema, updateStatusSchema };
