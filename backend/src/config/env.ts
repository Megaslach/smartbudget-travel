import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT: parseInt(process.env.PORT || '4000', 10),
  DATABASE_URL: process.env.DATABASE_URL!,
  JWT_SECRET: process.env.JWT_SECRET || 'fallback-secret-change-me',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  RAPIDAPI_KEY: process.env.RAPIDAPI_KEY || '',
  KIWI_API_KEY: process.env.KIWI_API_KEY || '',
  AMADEUS_CLIENT_ID: process.env.AMADEUS_CLIENT_ID || '',
  AMADEUS_CLIENT_SECRET: process.env.AMADEUS_CLIENT_SECRET || '',
  AMADEUS_ENV: process.env.AMADEUS_ENV || 'test',
  SERPAPI_KEY: process.env.SERPAPI_KEY || '',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  STRIPE_PRICE_ID: process.env.STRIPE_PRICE_ID || '',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || '',
  PRICE_ALERT_CRON: process.env.PRICE_ALERT_CRON || '0 8 * * *',
};
