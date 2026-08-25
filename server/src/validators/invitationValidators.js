const { z } = require('zod');

const publishExamSchema = z.object({
  participantIds: z.array(z.string().min(1)).min(1),
});

const sendInvitationsSchema = z.object({
  participantIds: z.array(z.string().min(1)).min(1),
});

module.exports = { publishExamSchema, sendInvitationsSchema };
