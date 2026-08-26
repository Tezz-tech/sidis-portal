const mockGenerateContent = jest.fn();

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(({ apiKey }) => ({
    models: {
      generateContent: (args) => mockGenerateContent(apiKey, args),
    },
  })),
}));

jest.mock('../src/config/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }));

jest.mock('../src/config/env', () => ({
  AI_API_KEYS: ['key-a', 'key-b'],
  AI_MODELS: ['model-1', 'model-2'],
}));

let callGemini;
let AppError;

beforeEach(() => {
  jest.resetModules();
  mockGenerateContent.mockReset();
  // Re-required alongside aiClient after resetModules() so both come from
  // the same module registry — otherwise `instanceof AppError` fails below
  // even though it's the same class, just a different registry copy.
  AppError = require('../src/utils/AppError');
  ({ callGemini } = require('../src/services/aiClient'));
});

describe('AI provider rotation', () => {
  test('falls back to the next model in the chain when one hits a quota error', async () => {
    mockGenerateContent.mockImplementation((apiKey, { model }) => {
      if (model === 'model-1') {
        const err = new Error('Resource exhausted');
        err.status = 429;
        throw err;
      }
      return { text: 'ok-from-model-2', usageMetadata: {} };
    });

    const result = await callGemini({ systemInstruction: 's', prompt: 'p', label: 'test' });

    expect(result).toBe('ok-from-model-2');
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
  });

  test('retries a transient failure on the same model before falling back', async () => {
    let modelOneAttempts = 0;
    mockGenerateContent.mockImplementation((apiKey, { model }) => {
      if (model === 'model-1') {
        modelOneAttempts += 1;
        const err = new Error('internal error');
        err.status = 500;
        throw err;
      }
      return { text: 'ok-from-model-2', usageMetadata: {} };
    });

    const result = await callGemini({ systemInstruction: 's', prompt: 'p', label: 'test' });

    expect(result).toBe('ok-from-model-2');
    expect(modelOneAttempts).toBe(2); // MAX_ATTEMPTS_PER_MODEL, then falls through
  });

  test('skips the rest of a key\'s models and rotates keys on an auth error', async () => {
    mockGenerateContent.mockImplementation((apiKey) => {
      if (apiKey === 'key-a') {
        const err = new Error('API key not valid');
        err.status = 403;
        throw err;
      }
      return { text: 'ok-from-key-b', usageMetadata: {} };
    });

    const result = await callGemini({ systemInstruction: 's', prompt: 'p', label: 'test' });

    expect(result).toBe('ok-from-key-b');
    // One attempt for key-a (whole model chain skipped after the auth error), one for key-b.
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
  });

  test('throws a generic, provider-agnostic error once every key and model is exhausted', async () => {
    mockGenerateContent.mockImplementation(() => {
      const err = new Error('Resource exhausted for gemini-3.7-flash on key-a');
      err.status = 429;
      throw err;
    });

    let caught;
    try {
      await callGemini({ systemInstruction: 's', prompt: 'p', label: 'test' });
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(AppError);
    expect(caught.statusCode).toBe(503);
    expect(caught.code).toBe('AI_UNAVAILABLE');
    expect(caught.message.toLowerCase()).not.toMatch(/gemini|model-1|model-2|key-a|key-b/);
  });

  test('throws immediately with no API keys configured, without ever calling the provider', async () => {
    jest.resetModules();
    jest.doMock('../src/config/env', () => ({ AI_API_KEYS: [], AI_MODELS: ['model-1'] }));
    const { callGemini: callWithNoKeys } = require('../src/services/aiClient');

    await expect(callWithNoKeys({ systemInstruction: 's', prompt: 'p', label: 'test' })).rejects.toMatchObject({
      statusCode: 503,
      code: 'AI_UNAVAILABLE',
    });
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });
});
