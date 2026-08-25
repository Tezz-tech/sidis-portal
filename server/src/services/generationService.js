const { z } = require('zod');
const { callClaude, extractJsonText } = require('./aiClient');
const env = require('../config/env');
const AppError = require('../utils/AppError');

// Roughly 4 characters per token; keep a wide safety margin under the model's
// context window so a single chunk plus prompt scaffolding never overflows.
const CHUNK_CHAR_BUDGET = 60000;

const generatedQuestionSchema = z
  .object({
    type: z.enum(['mcq', 'true_false', 'short_answer']),
    prompt: z.string().min(1),
    options: z.array(z.object({ key: z.string(), text: z.string() })).optional().default([]),
    correctOptionKey: z.string().nullable().optional(),
    expectedAnswer: z.string().nullable().optional(),
    gradingGuidance: z.string().nullable().optional(),
    points: z.number().positive().default(1),
    sourceExcerpt: z.string().min(1),
  })
  .superRefine((q, ctx) => {
    if ((q.type === 'mcq' || q.type === 'true_false') && (!q.options || q.options.length < 2)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'mcq/true_false questions need at least two options' });
    }
    if ((q.type === 'mcq' || q.type === 'true_false') && !q.correctOptionKey) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'mcq/true_false questions need a correctOptionKey' });
    }
    if (q.type === 'short_answer' && !q.expectedAnswer) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'short_answer questions need an expectedAnswer' });
    }
  });

const generationResponseSchema = z.object({
  questions: z.array(generatedQuestionSchema),
});

function chunkText(text) {
  if (text.length <= CHUNK_CHAR_BUDGET) return [text];
  const chunks = [];
  for (let i = 0; i < text.length; i += CHUNK_CHAR_BUDGET) {
    chunks.push(text.slice(i, i + CHUNK_CHAR_BUDGET));
  }
  return chunks;
}

function buildSystemPrompt() {
  return `You write exam questions for an assessment platform. You will be given a passage of source material and must write exam questions drawn strictly from it.

Rules, all mandatory:
- Every question must be answerable using only the passage given. Never require outside knowledge.
- Never write a question about the document's formatting, page numbers, headers, footers, or other metadata.
- For "mcq" and "true_false" questions: write plausible distractors drawn from concepts in the passage, never arbitrary or silly filler. Exactly one option is correct. Use option keys "A", "B", "C", "D" (true_false uses "A" for True and "B" for False).
- For "short_answer" questions: provide expectedAnswer (the core correct answer) and gradingGuidance (what a grader should look for to award credit).
- Every question must include sourceExcerpt: the exact passage (a sentence or two, verbatim from the source) the question was drawn from.
- Assign points as an integer, normally 1, higher only for questions that require synthesizing multiple parts of the passage.
- Output strict JSON only, matching this exact shape, with no prose before or after:
{"questions":[{"type":"mcq|true_false|short_answer","prompt":"...","options":[{"key":"A","text":"..."}],"correctOptionKey":"A","expectedAnswer":null,"gradingGuidance":null,"points":1,"sourceExcerpt":"..."}]}`;
}

function buildUserPrompt({ passage, count, typeMix, difficulty }) {
  const typeInstruction = typeMix === 'mixed'
    ? 'Use a mix of mcq, true_false, and short_answer question types, weighted toward mcq.'
    : `Every question must be type "${typeMix}".`;

  return `Passage:
"""
${passage}
"""

Write exactly ${count} exam questions from this passage.
${typeInstruction}
Target difficulty: ${difficulty}.
Return JSON only, matching the schema described in the system prompt.`;
}

async function callAndParse({ passage, count, typeMix, difficulty, organizationId }) {
  const model = env.AI_GENERATION_MODEL;
  const system = buildSystemPrompt();
  const userPrompt = buildUserPrompt({ passage, count, typeMix, difficulty });

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const response = await callClaude({
      model,
      system,
      messages: [{ role: 'user', content: userPrompt }],
      maxTokens: Math.min(8192, 400 * count + 1024),
      organizationId,
      label: 'question_generation',
    });

    const raw = extractJsonText(response);
    let parsed;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch (err) {
      if (attempt === 2) throw new AppError('The AI returned a response we could not read. Try again.', 502, 'AI_INVALID_JSON');
      continue; // eslint-disable-line no-continue
    }

    const result = generationResponseSchema.safeParse(parsed);
    if (result.success) return result.data.questions;
    if (attempt === 2) {
      throw new AppError('The AI returned questions that did not match the expected format. Try again.', 502, 'AI_SCHEMA_INVALID');
    }
  }
  return [];
}

function normalizeForDedup(prompt) {
  return prompt.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function dedupeQuestions(questions) {
  const seen = new Set();
  const deduped = [];
  for (const q of questions) {
    const key = normalizeForDedup(q.prompt).slice(0, 80);
    if (seen.has(key)) continue; // eslint-disable-line no-continue
    seen.add(key);
    deduped.push(q);
  }
  return deduped;
}

/**
 * Generates `count` questions from `documentText`, chunking long documents
 * and distributing the question count proportionally across chunks, then
 * deduplicating near-identical questions across chunk boundaries.
 */
async function generateQuestions({ documentText, count, typeMix = 'mixed', difficulty = 'medium', organizationId }) {
  const chunks = chunkText(documentText);
  const perChunk = chunks.map((_, i) => {
    const base = Math.floor(count / chunks.length);
    const remainder = count % chunks.length;
    return base + (i < remainder ? 1 : 0);
  }).filter((n) => n > 0);

  const results = [];
  for (let i = 0; i < perChunk.length; i += 1) {
    // Sequential, not parallel: keeps AI spend and rate-limit exposure
    // predictable for a single generation job, and lets a later chunk see
    // how many questions still remain if an earlier chunk under-delivers.
    const questions = await callAndParse({
      passage: chunks[i],
      count: perChunk[i],
      typeMix,
      difficulty,
      organizationId,
    });
    results.push(...questions);
  }

  const deduped = dedupeQuestions(results);
  return deduped.slice(0, count);
}

module.exports = { generateQuestions, chunkText, dedupeQuestions };
