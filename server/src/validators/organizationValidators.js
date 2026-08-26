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

const adjustCreditsSchema = z.object({
  amount: z.number().int().refine((n) => n !== 0, 'Amount cannot be zero'),
  description: z.string().min(1),
});

const suspendOrganizationSchema = z.object({
  status: z.enum(['active', 'suspended']),
});

const updateOrganizationSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(['school', 'company', 'other']).optional(),
  logoUrl: z.string().url().nullable().optional(),
});

const updateOrgTeamRoleSchema = z.object({
  role: z.enum(['org_admin', 'creator']),
});

const updateOrgTeamStatusSchema = z.object({
  status: z.enum(['active', 'disabled']),
});

module.exports = {
  createOrganizationSchema,
  grantCreditsSchema,
  adjustCreditsSchema,
  suspendOrganizationSchema,
  updateOrganizationSchema,
  updateOrgTeamRoleSchema,
  updateOrgTeamStatusSchema,
};
