import { readFileSync } from 'node:fs';
import { z } from 'zod';

// Vars that may arrive either as a plain value or, in production behind Docker secrets, as
// `<KEY>_FILE` pointing at a file containing the value (Compose mounts secrets under
// /run/secrets/*, never as plain env vars). Plain value wins if both are somehow set.
const SECRET_FILE_KEYS = ['JWT_SECRET', 'GOOGLE_CLIENT_SECRET', 'DATABASE_URL'] as const;

function resolveSecretFiles(source: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const resolved = { ...source };
  for (const key of SECRET_FILE_KEYS) {
    if (resolved[key]) continue;
    const filePath = source[`${key}_FILE`];
    if (!filePath) continue;
    try {
      resolved[key] = readFileSync(filePath, 'utf-8').trim();
    } catch (err) {
      console.error(`Failed to read secret file for ${key} at ${filePath}:`, err);
      process.exit(1);
    }
  }
  return resolved;
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'GOOGLE_CLIENT_SECRET is required'),
  GOOGLE_REDIRECT_URI: z.string().url(),
  FRONTEND_URL: z.string().url(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

const parsed = envSchema.safeParse(resolveSecretFiles(process.env));

if (!parsed.success) {
  console.error('Invalid environment configuration:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
