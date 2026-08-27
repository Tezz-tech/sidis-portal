const cloudinary = require('../config/cloudinary');
const logger = require('../config/logger');
const {
  Organization, User, Participant, Document, Exam, Question,
  Invitation, Attempt, CreditTransaction, Payment,
} = require('../models');
const { writeAuditLog } = require('./auditService');
const AppError = require('../utils/AppError');

/**
 * Platform-owner GDPR/NDPR tooling, scoped to one organization at a time —
 * operates on an explicit organizationId param rather than a tenant
 * context, same as the rest of the platform-owner surface (see
 * organizationService.js).
 */
async function exportOrganizationData(organizationId) {
  const organization = await Organization.findById(organizationId).lean();
  if (!organization) throw new AppError('Organization not found', 404, 'NOT_FOUND');

  const filter = { organization: organizationId };
  const [users, participants, documents, exams, questions, invitations, attempts, creditTransactions, payments] = await Promise.all([
    User.find(filter).select('-passwordHash -inviteToken -passwordResetToken').lean(),
    Participant.find(filter).lean(),
    Document.find(filter).select('-extractedText').lean(),
    Exam.find(filter).lean(),
    Question.find(filter).lean(),
    Invitation.find(filter).lean(),
    Attempt.find(filter).lean(),
    CreditTransaction.find(filter).lean(),
    Payment.find(filter).lean(),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    organization,
    users,
    participants,
    documents,
    exams,
    questions,
    invitations,
    attempts,
    creditTransactions,
    payments,
  };
}

// Cloudinary URLs look like .../upload/v<version>/<public_id>[.<ext>] — this
// is best-effort parsing, not a stored field (uploads never saved the
// public_id — see documentService.js). A miss here just leaves one asset
// uncleaned, never a wrong deletion: destroy() no-ops on a bad id.
function extractCloudinaryPublicId(secureUrl) {
  const match = typeof secureUrl === 'string' && secureUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/);
  return match ? match[1] : null;
}

async function eraseOrganizationData(organizationId, actorId, confirmName) {
  const organization = await Organization.findById(organizationId);
  if (!organization) throw new AppError('Organization not found', 404, 'NOT_FOUND');
  if (confirmName !== organization.name) {
    throw new AppError('Type the organization name exactly to confirm deletion', 400, 'CONFIRMATION_MISMATCH');
  }

  const filter = { organization: organizationId };
  const documents = await Document.find(filter, 'storageUrl').lean();

  await Promise.all(
    documents.map(async (doc) => {
      const publicId = extractCloudinaryPublicId(doc.storageUrl);
      if (!publicId) return;
      try {
        await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
      } catch (err) {
        logger.warn({ err, documentId: doc._id }, 'Failed to delete Cloudinary asset during organization erase');
      }
    }),
  );

  // Written before deletion, with organization: null so this record isn't
  // itself scoped to (and wiped out by) the deletion it documents.
  await writeAuditLog({
    organization: null,
    actor: actorId,
    action: 'organization.erased',
    targetModel: 'Organization',
    targetId: organizationId,
    metadata: { organizationName: organization.name, organizationSlug: organization.slug },
  });

  await Promise.all([
    User.deleteMany(filter),
    Participant.deleteMany(filter),
    Document.deleteMany(filter),
    Question.deleteMany(filter),
    Invitation.deleteMany(filter),
    Attempt.deleteMany(filter),
    CreditTransaction.deleteMany(filter),
    Payment.deleteMany(filter),
    Exam.deleteMany(filter),
  ]);

  await Organization.deleteOne({ _id: organizationId });
}

module.exports = { exportOrganizationData, eraseOrganizationData };
