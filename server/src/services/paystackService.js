const crypto = require('crypto');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

async function initializeTransaction({ email, amountKobo, metadata, reference }) {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: amountKobo,
      reference,
      metadata,
      callback_url: `${env.FRONTEND_URL}/app/billing/callback`,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.status) {
    logger.error({ data }, 'Paystack initialize failed');
    throw new AppError('We could not start the payment. Try again.', 502, 'PAYSTACK_ERROR');
  }
  return data.data; // { authorization_url, access_code, reference }
}

async function verifyTransaction(reference) {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}` },
  });
  const data = await res.json();
  if (!res.ok || !data.status) {
    throw new AppError('We could not verify this payment', 502, 'PAYSTACK_ERROR');
  }
  return data.data;
}

function verifyWebhookSignature(rawBody, signature) {
  const hash = crypto.createHmac('sha512', env.PAYSTACK_SECRET_KEY).update(rawBody).digest('hex');
  const hashBuffer = Buffer.from(hash, 'hex');
  const signatureBuffer = Buffer.from(typeof signature === 'string' ? signature : '', 'hex');
  // timingSafeEqual throws on mismatched lengths rather than returning
  // false, so an invalid/absent signature has to be caught before it —
  // that length check alone leaks nothing an attacker doesn't already know
  // (the hash length is fixed and public).
  if (hashBuffer.length !== signatureBuffer.length) return false;
  return crypto.timingSafeEqual(hashBuffer, signatureBuffer);
}

module.exports = { initializeTransaction, verifyTransaction, verifyWebhookSignature };
