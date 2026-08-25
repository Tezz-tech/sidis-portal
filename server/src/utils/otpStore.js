const crypto = require('crypto');
const { OtpCode, ParticipantSession } = require('../models');

const OTP_TTL_MS = 10 * 60 * 1000;
const SESSION_NONCE_TTL_MS = 3 * 60 * 60 * 1000;

async function storeOtp(invitationId, code) {
  await OtpCode.findOneAndUpdate(
    { invitation: invitationId },
    { code, expiresAt: new Date(Date.now() + OTP_TTL_MS) },
    { upsert: true },
  );
}

async function verifyOtp(invitationId, code) {
  const record = await OtpCode.findOne({ invitation: invitationId });
  if (!record || record.expiresAt < new Date() || record.code !== code) return false;
  await OtpCode.deleteOne({ _id: record._id });
  return true;
}

/**
 * A new code verification invalidates any previously issued session for this
 * invitation: the nonce is overwritten and the participant JWT carries it, so
 * an older token — still cryptographically valid — fails this check.
 */
async function issueSessionNonce(invitationId) {
  const nonce = crypto.randomBytes(24).toString('hex');
  await ParticipantSession.findOneAndUpdate(
    { invitation: invitationId },
    { nonce, expiresAt: new Date(Date.now() + SESSION_NONCE_TTL_MS) },
    { upsert: true },
  );
  return nonce;
}

async function isSessionNonceValid(invitationId, nonce) {
  const record = await ParticipantSession.findOne({ invitation: invitationId });
  if (!record || record.expiresAt < new Date()) return false;
  return record.nonce === nonce;
}

module.exports = { storeOtp, verifyOtp, issueSessionNonce, isSessionNonceValid };
