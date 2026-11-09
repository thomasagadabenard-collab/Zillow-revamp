import 'dotenv/config';
import path from 'node:path';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  API_PUBLIC_URL: z.string().url().default('http://localhost:4000'),
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  COOKIE_SECURE: z.string().default('false'),
  TRUST_PROXY: z.string().default('0'),
  ADMIN_EMAIL: z.union([z.string().email(), z.literal('')]).default(''),
  ADMIN_PASSWORD: z.string().optional().default(''),
  ADMIN_NOTIFICATION_EMAIL: z.union([z.string().email(), z.literal('')]).default(''),
  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z.string().default('false'),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  EMAIL_FROM: z.string().default(''),
  NOWPAYMENTS_API_KEY: z.string().optional().default(''),
  NOWPAYMENTS_IPN_SECRET: z.string().optional().default(''),
  NOWPAYMENTS_API_BASE: z.string().url().default('https://api.nowpayments.io/v1'),
  NOWPAYMENTS_PRICE_CURRENCY: z.string().length(3).default('usd'),
  NOWPAYMENTS_PAY_CURRENCY: z.string().min(3).default('btc'),
  NOWPAYMENTS_IPN_URL: z.string().url().optional().default('https://api.yourdomain.com/api/payments/nowpayments/ipn'),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_IMAGE_BYTES: z.coerce.number().int().positive().default(1572864),
  MAX_MEDIA_BYTES: z.coerce.number().int().positive().default(52428800),
  MAX_MEDIA_FILES: z.coerce.number().int().positive().max(12).default(8),
}).parse(process.env);

export const env = {
  ...schema,
  isProduction: schema.NODE_ENV === 'production',
  cookieSecure: schema.COOKIE_SECURE === 'true' || schema.NODE_ENV === 'production',
  trustProxy: schema.TRUST_PROXY === 'true' ? 1 : Number(schema.TRUST_PROXY) || 0,
  smtpSecure: schema.SMTP_SECURE === 'true',
  adminNotificationEmail: schema.ADMIN_NOTIFICATION_EMAIL || schema.ADMIN_EMAIL,
  uploadDir: path.resolve(process.cwd(), schema.UPLOAD_DIR),
  apiPublicUrl: schema.API_PUBLIC_URL.replace(/\/$/, ''),
  clientUrl: schema.CLIENT_URL.replace(/\/$/, ''),
  nowPaymentsApiBase: schema.NOWPAYMENTS_API_BASE.replace(/\/$/, ''),
};
