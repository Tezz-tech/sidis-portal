const { GoogleGenAI } = require('@google/genai');
const env = require('../config/env');
const logger = require('../config/logger');
const AppError = require('../utils/AppError');

// Ordered fallback chain, most-capable first. A model is only tried once
// every model ahead of it has failed or hit its rate limit on the current
// key. Overridable via AI_MODELS (comma-separated) without a code change.
// Verified live against the ListModels endpoint — gemini-2.5-flash,
// gemini-2.5-flash-lite, and plain gemini-3-flash are excluded because
// Google has deprecated/never shipped them for new API keys (both 404).
// gemini-flash-lite-latest closes the chain as a Google-maintained alias
// that always resolves to whatever the current lite flash model is, so a
// future deprecation like that one doesn't leave the chain empty.
const DEFAULT_MODEL_CHAIN = [
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3-flash-preview',
  'gemini-flash-lite-latest',
];

const MODELS = env.AI_MODELS.length > 0 ? env.AI_MODELS : DEFAULT_MODEL_CHAIN;
const API_KEYS = env.AI_API_KEYS;

const MAX_ATTEMPTS_PER_MODEL = 2;
const RETRY_DELAY_MS = 400;

const clientsByKey = new Map();
function clientFor(apiKey) {
  if (!clientsByKey.has(apiKey)) clientsByKey.set(apiKey, new GoogleGenAI({ apiKey }));
  return clientsByKey.get(apiKey);
}

// Sticky pointer to whichever key last succeeded, so a warm process doesn't
// re-walk keys it already knows are exhausted on every single call.
let activeKeyIndex = 0;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function classify(err) {
  const status = err?.status ?? err?.code ?? err?.error?.code;
  const message = err?.message || '';
  const isAuthError = status === 401 || status === 403
    || (/api[_ ]?key/i.test(message) && /invalid|expired|not valid|missing/i.test(message));
  const isQuotaError = status === 429 || status === 'RESOURCE_EXHAUSTED';
  const isTransient = (typeof status === 'number' && status >= 500) || /network|timeout|ECONNRESET|fetch failed/i.test(message);
  return { isAuthError, isQuotaError, isTransient };
}

/**
 * Generates text via the configured provider, transparently walking a
 * fallback chain of models and, once every model is exhausted on the
 * current key (rate limit or outage), rotating to the next API key. This is
 * how the app stays usable on free-tier quotas without anyone noticing a
 * limit was ever hit. Every attempt is logged internally with which
 * model/key slot was used, but a caller only ever sees plain response text
 * back or a generic AppError — never the provider, model, or key.
 */
async function callGemini({ systemInstruction, prompt, maxOutputTokens = 4096, temperature, organizationId = null, label = 'unlabeled' }) {
  if (API_KEYS.length === 0) {
    logger.error({ label }, 'AI call attempted with no API keys configured');
    throw new AppError('The AI service is not configured yet. Please try again later.', 503, 'AI_UNAVAILABLE');
  }

  let lastErr;
  for (let k = 0; k < API_KEYS.length; k += 1) {
    const keySlot = (activeKeyIndex + k) % API_KEYS.length;
    const client = clientFor(API_KEYS[keySlot]);
    let keyIsDead = false;

    for (let m = 0; m < MODELS.length; m += 1) {
      const model = MODELS[m];

      for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_MODEL; attempt += 1) {
        try {
          const response = await client.models.generateContent({
            model,
            contents: prompt,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              maxOutputTokens,
              ...(temperature != null ? { temperature } : {}),
            },
          });

          activeKeyIndex = keySlot;
          logger.info({
            organizationId,
            label,
            model,
            keySlot,
            attempt,
            inputTokens: response.usageMetadata?.promptTokenCount,
            outputTokens: response.usageMetadata?.candidatesTokenCount,
          }, 'AI call completed');
          return response.text;
        } catch (err) {
          lastErr = err;
          const { isAuthError, isQuotaError, isTransient } = classify(err);
          logger.warn({ err: err.message, label, model, keySlot, attempt, isAuthError, isQuotaError, isTransient }, 'AI call attempt failed');

          if (isAuthError) { keyIsDead = true; break; }
          if (isQuotaError) break; // no point retrying a rate limit — fall through to the next model
          if (!isTransient || attempt === MAX_ATTEMPTS_PER_MODEL) break; // non-transient, or out of retries — fall through to the next model
          await sleep(RETRY_DELAY_MS * attempt);
        }
      }

      if (keyIsDead) break; // this key itself is bad, skip its remaining models and rotate keys
    }
  }

  logger.error({ label, organizationId, err: lastErr?.message }, 'AI call exhausted every model and key');
  throw new AppError('The AI service is temporarily unavailable. Please try again shortly.', 503, 'AI_UNAVAILABLE');
}

module.exports = { callGemini };
