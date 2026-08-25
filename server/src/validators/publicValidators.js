const { z } = require('zod');

const leadSchema = z.object({
  organizationName: z.string().min(1),
  contactName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  organizationType: z.enum(['school', 'company', 'other']).default('other'),
  message: z.string().max(2000).optional(),
});

module.exports = { leadSchema };
