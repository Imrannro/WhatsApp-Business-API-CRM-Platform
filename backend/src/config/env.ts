import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().default('whatsapp-crm-secure-jwt-secret-key-2025'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  META_ACCESS_TOKEN: z.string().optional().default(''),
  META_PHONE_NUMBER_ID: z.string().optional().default(''),
  META_BUSINESS_ACCOUNT_ID: z.string().optional().default(''),
  META_VERIFY_TOKEN: z.string().default('whatsapp_webhook_secret_token_123'),
  META_API_VERSION: z.string().default('v21.0'),
  META_APP_SECRET: z.string().optional().default(''),
  WHATSAPP_PROVIDER: z.enum(['meta', 'mock']).default('mock'),
});

export const env = envSchema.parse(process.env);
