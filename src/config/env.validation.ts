import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['develop', 'development', 'production', 'test'])
    .default('develop'),
  PORT: z.coerce.number().int().positive().optional(),
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .url('DATABASE_URL must be a valid connection string'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().optional(),
  HASH_SALT: z.coerce.number().int().min(1).default(10),
});

export type EnvVariables = z.infer<typeof envSchema>;

export const validateEnv = (env: Record<string, unknown>): EnvVariables => {
  return envSchema.parse(env);
};
