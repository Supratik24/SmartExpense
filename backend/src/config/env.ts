import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
dotenv.config({ path: path.join(rootDir, '.env') });
dotenv.config();

const schema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  CORS_ORIGINS: z.string().optional(),
  ML_SERVICE_URL: z.string().url().default('http://localhost:8000')
});

export const env = schema.parse(process.env);

export const corsOrigins = (env.CORS_ORIGINS ?? env.CORS_ORIGIN)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
