import { z } from 'zod';

export const RegisterRequestSchema = z.strictObject({
  email: z.email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
  displayName: z.string().trim().min(1).max(120),
});

export const LoginRequestSchema = z.strictObject({
  email: z.email().transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128),
});

export const RefreshTokenRequestSchema = z.strictObject({
  refreshToken: z.string().min(32),
});

export const AccessTokenPayloadSchema = z.strictObject({
  sub: z.uuid(),
  email: z.email(),
  iat: z.number().int().positive(),
  exp: z.number().int().positive(),
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;
export type AccessTokenPayload = z.infer<typeof AccessTokenPayloadSchema>;
