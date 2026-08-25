const { z } = require('zod');

const createParticipantSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  externalId: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
});

const updateParticipantSchema = createParticipantSchema.partial();

const importRowSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  externalId: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
});

const importParticipantsSchema = z.object({
  rows: z.array(importRowSchema).min(1).max(5000),
});

module.exports = { createParticipantSchema, updateParticipantSchema, importParticipantsSchema, importRowSchema };
