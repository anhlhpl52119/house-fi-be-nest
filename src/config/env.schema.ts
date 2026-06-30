import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

loadDotenv();

const nodeEnvSchema = z.enum(['development', 'test', 'production']);

export const EnvSchema = z
  .object({
    NODE_ENV: nodeEnvSchema.default('development'),
    PORT: z.coerce.number().int().positive().max(65535).default(3000),
    DATABASE_URL: z.string().min(1).default('postgres://postgres:postgres@localhost:5432/postgres'),
    JWT_ACCESS_SECRET: z.string().min(16).default('development-access-secret-change-me'),
    JWT_REFRESH_SECRET: z.string().min(16).default('development-refresh-secret-change-me'),
    JWT_ACCESS_EXPIRES_IN: z.string().min(1).default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().min(1).default('30d'),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== 'production') {
      return;
    }

    if (env.JWT_ACCESS_SECRET.startsWith('development-')) {
      ctx.addIssue({
        code: 'custom',
        path: ['JWT_ACCESS_SECRET'],
        message: 'JWT_ACCESS_SECRET must be set to a production secret.',
      });
    }

    if (env.JWT_REFRESH_SECRET.startsWith('development-')) {
      ctx.addIssue({
        code: 'custom',
        path: ['JWT_REFRESH_SECRET'],
        message: 'JWT_REFRESH_SECRET must be set to a production secret.',
      });
    }
  });

export type Env = z.infer<typeof EnvSchema>;

export function parseEnv(input: NodeJS.ProcessEnv = process.env): Env {
  const parsed = EnvSchema.safeParse(input);

  if (!parsed.success) {
    const { fieldErrors, formErrors } = z.flattenError(parsed.error);
    throw new Error(
      `Invalid environment configuration: ${JSON.stringify({ fieldErrors, formErrors })}`,
    );
  }

  return parsed.data;
}
