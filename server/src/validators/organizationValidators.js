const { z } = require('zod');

const createOrganizationSchema = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers, and hyphens only'),
  type: z.enum(['school', 'company', 'other']).default('other'),
  adminEmail: z.string().email(),
  adminFirstName: z.string().min(1),
  adminLastName: z.string().min(1),
});

const grantCreditsSchema = z.object({
  amount: z.number().int().positive(),
  description: z.string().min(1),
});

const suspendOrganizationSchema = z.object({
  status: z.enum(['active', 'suspended']),
});

module.exports = { createOrganizationSchema, grantCreditsSchema, suspendOrganizationSchema };
