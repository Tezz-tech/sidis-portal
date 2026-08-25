const { scoped } = require('./scopedRepo');
const { Invitation, Participant, Question, Organization } = require('../models');
const examService = require('./examService');
const pricingService = require('./pricingService');
const creditService = require('./creditService');
const { randomToken } = require('../utils/tokens');
const { sendExamInviteEmail } = require('./emailService');
const AppError = require('../utils/AppError');
const { writeAuditLog } = require('./auditService');

const DEFAULT_EXPIRY_DAYS = 30;

async function shortAnswerRate(tenant, examId) {
  const shortAnswerCount = await scoped(Question, tenant).countDocuments({ exam: examId, type: 'short_answer' });
  const pricing = await pricingService.getPricingConfig();
  return { shortAnswerCount, rate: pricing.creditsPerShortAnswerGraded };
}

function expiryFor(exam) {
  if (exam.config.closesAt) return new Date(exam.config.closesAt);
  return new Date(Date.now() + DEFAULT_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
}

async function createInvitationsFor(tenant, exam, participantIds, actorId) {
  const participants = await scoped(Participant, tenant).find({ _id: { $in: participantIds } });
  if (participants.length === 0) {
    throw new AppError('No valid participants were selected', 400, 'NO_PARTICIPANTS');
  }

  const org = await Organization.findById(tenant.organizationId);
  const expiresAt = expiryFor(exam);
  const invitations = [];

  for (const participant of participants) {
    const existing = await scoped(Invitation, tenant).findOne({ exam: exam._id, participant: participant._id });
    if (existing) continue; // eslint-disable-line no-continue

    const invitation = await scoped(Invitation, tenant).create({
      exam: exam._id,
      participant: participant._id,
      token: randomToken(),
      status: 'sent',
      sentAt: new Date(),
      expiresAt,
    });
    invitations.push(invitation);

    await sendExamInviteEmail({
      to: participant.email,
      firstName: participant.firstName,
      examTitle: exam.title,
      organizationName: org.name,
      invitationToken: invitation.token,
    });
  }

  await writeAuditLog({
    organization: tenant.organizationId,
    actor: actorId,
    action: 'invitations.sent',
    targetModel: 'Exam',
    targetId: exam._id,
    metadata: { count: invitations.length },
  });

  return invitations;
}

async function publishAndInvite(tenant, examId, participantIds, actorId) {
  const exam = await examService.getExam(tenant, examId);
  if (exam.status !== 'review') {
    throw new AppError('Confirm the question set before publishing', 400, 'REVIEW_NOT_CONFIRMED');
  }
  if (!exam.reviewConfirmedAt) {
    throw new AppError('Confirm the question set before publishing', 400, 'REVIEW_NOT_CONFIRMED');
  }

  const { shortAnswerCount, rate } = await shortAnswerRate(tenant, examId);
  const reservationAmount = participantIds.length * shortAnswerCount * rate;

  if (reservationAmount > 0) {
    await creditService.reserve({
      organizationId: tenant.organizationId,
      amount: reservationAmount,
      reference: { model: 'Exam', id: examId },
      description: `Reserved grading credits for ${participantIds.length} participants`,
      createdBy: actorId,
    });
  }

  const invitations = await createInvitationsFor(tenant, exam, participantIds, actorId);

  exam.status = 'published';
  exam.publishedAt = new Date();
  await exam.save();

  await writeAuditLog({
    organization: tenant.organizationId,
    actor: actorId,
    action: 'exam.published',
    targetModel: 'Exam',
    targetId: examId,
  });

  return { exam, invitations };
}

async function sendMore(tenant, examId, participantIds, actorId) {
  const exam = await examService.getExam(tenant, examId);
  if (exam.status !== 'published') {
    throw new AppError('This exam is not currently published', 400, 'NOT_PUBLISHED');
  }

  const { shortAnswerCount, rate } = await shortAnswerRate(tenant, examId);
  const reservationAmount = participantIds.length * shortAnswerCount * rate;

  if (reservationAmount > 0) {
    await creditService.reserve({
      organizationId: tenant.organizationId,
      amount: reservationAmount,
      reference: { model: 'Exam', id: examId },
      description: `Reserved grading credits for ${participantIds.length} additional participants`,
      createdBy: actorId,
    });
  }

  return createInvitationsFor(tenant, exam, participantIds, actorId);
}

async function resend(tenant, examId, invitationId) {
  const invitation = await scoped(Invitation, tenant).findOne({ _id: invitationId, exam: examId });
  if (!invitation) throw new AppError('Invitation not found', 404, 'NOT_FOUND');

  const [exam, participant, org] = await Promise.all([
    examService.getExam(tenant, examId),
    scoped(Participant, tenant).findById(invitation.participant),
    Organization.findById(tenant.organizationId),
  ]);

  invitation.token = randomToken();
  invitation.sentAt = new Date();
  if (invitation.status === 'expired') invitation.status = 'sent';
  await invitation.save();

  await sendExamInviteEmail({
    to: participant.email,
    firstName: participant.firstName,
    examTitle: exam.title,
    organizationName: org.name,
    invitationToken: invitation.token,
  });

  return invitation;
}

async function listInvitations(tenant, examId) {
  return scoped(Invitation, tenant)
    .find({ exam: examId })
    .populate('participant', 'firstName lastName email externalId')
    .sort({ createdAt: -1 });
}

module.exports = { publishAndInvite, sendMore, resend, listInvitations };
