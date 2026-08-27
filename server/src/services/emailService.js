const { Resend } = require('resend');
const env = require('../config/env');
const logger = require('../config/logger');

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

async function send({ to, subject, html }) {
  if (!resend) {
    logger.warn({ to, subject }, 'RESEND_API_KEY not set — email not sent');
    return;
  }
  try {
    await resend.emails.send({ from: env.RESEND_FROM_EMAIL, to, subject, html });
  } catch (err) {
    logger.error({ err, to, subject }, 'Failed to send email');
  }
}

function layout(bodyHtml) {
  return `
    <div style="font-family: 'Public Sans', Arial, sans-serif; color: #1F2937; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
      <div style="font-family: Arial, sans-serif; font-weight: 700; letter-spacing: 0.02em; font-size: 18px; color: #1F2937; margin-bottom: 24px;">SIDIS</div>
      ${bodyHtml}
      <p style="font-size: 12px; color: #9AA3AF; margin-top: 32px;">Sidis Portal</p>
    </div>
  `;
}

async function sendInviteEmail({ to, firstName, organizationName, inviteToken }) {
  const url = `${env.FRONTEND_URL}/accept-invite?token=${inviteToken}`;
  await send({
    to,
    subject: `You have been invited to ${organizationName} on Sidis`,
    html: layout(`
      <p>Hello ${firstName},</p>
      <p>You have been invited to join <strong>${organizationName}</strong> on Sidis Portal. This link expires in 72 hours.</p>
      <p><a href="${url}" style="background:#1F2937;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Accept invite</a></p>
    `),
  });
}

async function sendPasswordResetEmail({ to, firstName, resetToken }) {
  const url = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  await send({
    to,
    subject: 'Reset your Sidis password',
    html: layout(`
      <p>Hello ${firstName},</p>
      <p>Use the link below to reset your password. This link expires in 1 hour. If you did not request this, ignore this email.</p>
      <p><a href="${url}" style="background:#1F2937;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Reset password</a></p>
    `),
  });
}

async function sendWelcomeEmail({ to, firstName, organizationName }) {
  await send({
    to,
    subject: `Welcome to Sidis`,
    html: layout(`
      <p>Hello ${firstName},</p>
      <p>Your account is set up and you're now part of <strong>${organizationName}</strong> on Sidis. You're ready to start building and managing exams.</p>
      <p><a href="${env.FRONTEND_URL}/login" style="background:#1F2937;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Sign in</a></p>
    `),
  });
}

async function sendPasswordChangedEmail({ to, firstName }) {
  await send({
    to,
    subject: 'Your Sidis password was changed',
    html: layout(`
      <p>Hello ${firstName},</p>
      <p>This confirms your Sidis password was just changed. If you made this change, no action is needed.</p>
      <p>If you didn't request this, contact us immediately — someone else may have access to your account.</p>
    `),
  });
}

async function sendGenerationFailedEmail({ to, firstName, examTitle, reason }) {
  await send({
    to,
    subject: `${examTitle} — question generation failed`,
    html: layout(`
      <p>Hello ${firstName},</p>
      <p>We couldn't generate questions for <strong>${examTitle}</strong>: ${reason}</p>
      <p>Your credits for this attempt have been released. You can try generating again from the exam's Generate page.</p>
    `),
  });
}

async function sendExamInviteEmail({ to, firstName, examTitle, organizationName, invitationToken }) {
  const url = `${env.FRONTEND_URL}/exam/${invitationToken}`;
  await send({
    to,
    subject: `You have been invited to take ${examTitle}`,
    html: layout(`
      <p>Hello ${firstName},</p>
      <p><strong>${organizationName}</strong> has invited you to take <strong>${examTitle}</strong>.</p>
      <p><a href="${url}" style="background:#1F2937;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Start</a></p>
    `),
  });
}

async function sendParticipantCodeEmail({ to, code, examTitle }) {
  await send({
    to,
    subject: `Your code for ${examTitle}: ${code}`,
    html: layout(`
      <p>Your verification code is:</p>
      <p style="font-family: 'IBM Plex Mono', monospace; font-size: 28px; letter-spacing: 0.1em; font-weight: 500;">${code}</p>
      <p>This code is valid for 10 minutes.</p>
    `),
  });
}

async function sendGenerationCompleteEmail({ to, firstName, examTitle, questionCount }) {
  await send({
    to,
    subject: `${examTitle} is ready for review`,
    html: layout(`
      <p>Hello ${firstName},</p>
      <p>${questionCount} questions have been generated for <strong>${examTitle}</strong> and are ready for your review.</p>
    `),
  });
}

// `result` is only passed when the exam's visibility setting allows it to be
// shown right now (immediate, or after_close and already closed) — matching
// exactly what the participant would see if they clicked through, so the
// email never states a score the app itself would still be hiding.
async function sendResultReadyEmail({ to, firstName, examTitle, invitationToken, result }) {
  const url = `${env.FRONTEND_URL}/exam/${invitationToken}`;
  const resultHtml = result
    ? `<p style="font-family: 'IBM Plex Mono', monospace; font-size: 32px; font-weight: 500; margin: 8px 0;">${result.percentage}%</p>
       <p>${result.score} / ${result.totalPoints} points · pass mark ${result.passMark}% · <strong>${result.passed ? 'Passed' : 'Not passed'}</strong></p>`
    : `<p>Your submission for <strong>${examTitle}</strong> has been graded.</p>`;
  await send({
    to,
    subject: `Your result for ${examTitle} is ready`,
    html: layout(`
      <p>Hello ${firstName},</p>
      ${resultHtml}
      <p><a href="${url}" style="background:#1F2937;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">View your result</a></p>
    `),
  });
}

async function sendAttemptCompleteToInstructorEmail({ to, firstName, examTitle, participantName, examId }) {
  const url = `${env.FRONTEND_URL}/app/exams/${examId}/results`;
  await send({
    to,
    subject: `${participantName} completed ${examTitle}`,
    html: layout(`
      <p>Hello ${firstName},</p>
      <p><strong>${participantName}</strong> has completed and been graded on <strong>${examTitle}</strong>.</p>
      <p><a href="${url}" style="background:#1F2937;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">View results</a></p>
    `),
  });
}

async function sendLowCreditEmail({ to, organizationName, balance }) {
  await send({
    to,
    subject: `${organizationName} is running low on credits`,
    html: layout(`
      <p>Your organization's credit balance is now <strong>${balance}</strong>.</p>
      <p>Buy more credits from the billing page to keep generating and grading exams without interruption.</p>
    `),
  });
}

async function sendReceiptEmail({ to, organizationName, credits, amountKobo, reference }) {
  const naira = (amountKobo / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' });
  await send({
    to,
    subject: `Receipt: ${credits} credits purchased`,
    html: layout(`
      <p>Thank you for your purchase on behalf of <strong>${organizationName}</strong>.</p>
      <p>Credits: ${credits}<br/>Amount: ${naira}<br/>Reference: ${reference}</p>
    `),
  });
}

module.exports = {
  send,
  sendInviteEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendPasswordChangedEmail,
  sendGenerationFailedEmail,
  sendExamInviteEmail,
  sendParticipantCodeEmail,
  sendGenerationCompleteEmail,
  sendResultReadyEmail,
  sendAttemptCompleteToInstructorEmail,
  sendLowCreditEmail,
  sendReceiptEmail,
};
