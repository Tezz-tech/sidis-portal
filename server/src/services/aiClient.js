const Anthropic = require('@anthropic-ai/sdk');
const env = require('../config/env');
const logger = require('../config/logger');

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, timeout: 120 * 1000 });

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

/**
 * Wraps a Claude call with exponential-backoff retry and structured logging
 * of token usage per organization, as required by the AI integration spec.
 */
async function callClaude({ model, system, messages, maxTokens = 4096, organizationId = null, label = 'unlabeled' }) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await client.messages.create({
        model,
        max_tokens: maxTokens,
        system,
        messages,
      });

      logger.info(
        {
          organizationId,
          label,
          model,
          inputTokens: response.usage?.input_tokens,
          outputTokens: response.usage?.output_tokens,
          attempt,
        },
        'AI call completed',
      );

      return response;
    } catch (err) {
      lastError = err;
      const retryable = err.status === 429 || err.status >= 500;
      logger.warn({ err: err.message, attempt, label, retryable }, 'AI call failed');
      if (!retryable || attempt === MAX_RETRIES) break;
      const delay = BASE_DELAY_MS * 2 ** (attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

function extractJsonText(response) {
  const block = response.content.find((c) => c.type === 'text');
  return block ? block.text : '';
}

module.exports = { callClaude, extractJsonText };
