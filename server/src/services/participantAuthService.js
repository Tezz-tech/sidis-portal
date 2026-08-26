const { Invitation, Exam, Participant, Organization } = require('../models');
const { sixDigitCode } = require('../utils/tokens');
const { storeOtp, verifyOtp, issueSessionNonce } = require('../utils/otpStore');
const { signParticipantToken } = require('../utils/jwt');
const { sendParticipantCodeEmail } = require('./emailService');
const AppError = require('../utils/AppError');

/**
 * Participant-facing lookups are keyed by the invitation token itself, not a
 * verified tenant context — that context doesn't exist until after OTP
 * verification. The token is the credential here.
 */
async function loadInvitation(token) {
  const invitation = await Invitation.findOne({ token });
  if (!invitation) {
    throw new AppError('This invitation link is not valid', 404, 'INVALID_INVITATION');
  }
  return invitation;
}

async function getInvitePreview(token) {
  const invitation = await loadInvitation(token);
  const [exam, participant, org] = await Promise.all([
    Exam.findById(invitation.exam),
    Participant.findById(invitation.participant),
    Organization.findById(invitation.organization),
  ]);

  if (invitation.expiresAt < new Date() && invitation.status !== 'started') {
    throw new AppError('This invitation has expired. Ask your organizer to resend it.', 410, 'INVITATION_EXPIRED');
  }
  if (exam.status !== 'published' && exam.status !== 'closed') {
    throw new AppError('This exam is not currently available', 400, 'EXAM_NOT_AVAILABLE');
  }

  return {
    organizationName: org.name,
    organizationLogoUrl: org.logoUrl,
    examTitle: exam.title,
    examDescription: exam.description,
    durationMinutes: exam.config.durationMinutes,
    questionCount: exam.questionCount,
    passMark: exam.config.passMark,
    allowRetakes: exam.config.allowRetakes,
    participantFirstName: participant.firstName,
    invitationStatus: invitation.status,
    // So the instructions screen can show a countdown / "closed" state
    // up front instead of only finding out when /attempt/start rejects it.
    opensAt: exam.config.opensAt,
    closesAt: exam.config.closesAt,
    examStatus: exam.status,
  };
}

async function requestCode(token) {
  const invitation = await loadInvitation(token);
  const participant = await Participant.findById(invitation.participant);
  const exam = await Exam.findById(invitation.exam);

  const code = sixDigitCode();
  await storeOtp(invitation._id.toString(), code);
  await sendParticipantCodeEmail({ to: participant.email, code, examTitle: exam.title });

  if (invitation.status === 'sent') {
    invitation.status = 'opened';
    invitation.openedAt = invitation.openedAt || new Date();
    await invitation.save();
  }

  // Mask the email for the client so the verification screen can confirm
  // "code sent to j***@example.com" without exposing the full address.
  const [user, domain] = participant.email.split('@');
  return { maskedEmail: `${user[0]}***@${domain}` };
}

async function verifyCode(token, code) {
  const invitation = await loadInvitation(token);
  const valid = await verifyOtp(invitation._id.toString(), code);
  if (!valid) {
    throw new AppError('That code is incorrect or has expired', 400, 'INVALID_CODE');
  }

  // Whether a new attempt is allowed (already attempted, retakes, max
  // attempts, resume) is decided by attemptService.getOrCreateAttempt once
  // the participant reaches the instructions screen — verifying the code
  // only needs to authenticate them, not pre-judge attempt eligibility.
  const sessionNonce = await issueSessionNonce(invitation._id.toString());
  const sessionToken = signParticipantToken({
    organizationId: invitation.organization.toString(),
    participantId: invitation.participant.toString(),
    invitationId: invitation._id.toString(),
    examId: invitation.exam.toString(),
    sessionNonce,
  });

  return sessionToken;
}

module.exports = { getInvitePreview, requestCode, verifyCode };
