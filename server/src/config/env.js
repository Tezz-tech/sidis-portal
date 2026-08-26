const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { z } = require('zod');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(8080),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),

  GEMINI_API_KEY: z.string().min(1).optional(),
  AI_GENERATION_MODEL: z.string().default('gemini-3.7-flash'),
  AI_GRADING_MODEL: z.string().default('gemini-3.7-flash'),

  PAYSTACK_SECRET_KEY: z.string().optional(),
  PAYSTACK_PUBLIC_KEY: z.string().optional(),

  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().default('noreply@sidis.app'),

  CLOUDINARY_URL: z.string().optional(),

  FRONTEND_URL: z.string().default('http://localhost:5173'),
  COOKIE_DOMAIN: z.string().default('localhost'),

  PLATFORM_OWNER_EMAIL: z.string().optional(),
  PLATFORM_OWNER_PASSWORD: z.string().optional(),
});

// A blank value in .env (KEY=, with nothing after the `=`) is dotenv-set as
// an empty string, not left unset — which would otherwise fail a `.min(1)`
// check even though the field is `.optional()`. Since an empty string is
// never a meaningful value for anything in this schema, it's normalized to
// "not set" here so leaving an optional secret blank while scaffolding a
// .env file doesn't crash the whole app.
const rawEnv = Object.fromEntries(
  Object.entries(process.env).map(([key, value]) => [key, value === '' ? undefined : value]),
);

const parsed = schema.safeParse(rawEnv);

if (!parsed.success) {
  const isTest = rawEnv.NODE_ENV === 'test';
  if (!isTest) {
    // eslint-disable-next-line no-console
    console.error('Invalid environment configuration:');
    // eslint-disable-next-line no-console
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
}

const env = parsed.success ? parsed.data : schema.parse({
  ...rawEnv,
  MONGODB_URI: rawEnv.MONGODB_URI || 'mongodb://127.0.0.1:27017/SidisPortalTest',
  JWT_ACCESS_SECRET: rawEnv.JWT_ACCESS_SECRET || 'test'.repeat(10),
  JWT_REFRESH_SECRET: rawEnv.JWT_REFRESH_SECRET || 'test'.repeat(10),
});

module.exports = env;
