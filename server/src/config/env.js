const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { z } = require('zod');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(8080),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),

  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  AI_GENERATION_MODEL: z.string().default('claude-sonnet-5'),
  AI_GRADING_MODEL: z.string().default('claude-haiku-4-5-20251001'),

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

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const isTest = process.env.NODE_ENV === 'test';
  if (!isTest) {
    // eslint-disable-next-line no-console
    console.error('Invalid environment configuration:');
    // eslint-disable-next-line no-console
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
}

const env = parsed.success ? parsed.data : schema.parse({
  ...process.env,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/SidisPortalTest',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'test'.repeat(10),
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'test'.repeat(10),
});

module.exports = env;
