const { GoogleGenAI } = require('@google/genai');
const env = require('../config/env');
const logger = require('../config/logger');

const client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

/**
 * Wraps a Gemini call with exponential-backoff retry and structured logging
 * of token usage per organization, as required by the AI integration spec.
 * Always requests JSON output (every caller in this app wants structured
 * data back) and returns the response text directly — Gemini's native JSON
 * mode means there's no prose-wrapped answer to pick apart, unlike the
 * regex-based extraction the previous provider needed.
 */
async function callGemini({ model, systemInstruction, prompt, maxOutputTokens = 4096, temperature, organizationId = null, label = 'unlabeled' }) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
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

      logger.info(
        {
          organizationId,
          label,
          model,
          inputTokens: response.usageMetadata?.promptTokenCount,
          outputTokens: response.usageMetadata?.candidatesTokenCount,
          attempt,
        },
        'AI call completed',
      );

      return response.text;
    } catch (err) {
      lastError = err;
      const status = err.status || err.code || err?.error?.code;
      const retryable = status === 429 || (typeof status === 'number' && status >= 500);
      logger.warn({ err: err.message, attempt, label, retryable }, 'AI call failed');
      if (!retryable || attempt === MAX_RETRIES) break;
      const delay = BASE_DELAY_MS * 2 ** (attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

module.exports = { callGemini };
