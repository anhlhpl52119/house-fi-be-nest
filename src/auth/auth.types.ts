import { z } from 'zod';

export const AuthUserResponseSchema = z.strictObject({
  id: z.uuid(),
  email: z.email(),
  displayName: z.string().min(1),
  avatarUrl: z.string().nullable(),
});

export const AuthHouseholdResponseSchema = z.strictObject({
  id: z.uuid(),
  name: z.string().min(1),
  role: z.enum(['owner', 'member']),
});

export const AuthTokensResponseSchema = z.strictObject({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  tokenType: z.literal('Bearer'),
});

export const AuthSessionResponseSchema = z.strictObject({
  user: AuthUserResponseSchema,
  household: AuthHouseholdResponseSchema,
  tokens: AuthTokensResponseSchema,
});

export const CurrentIdentityResponseSchema = z.strictObject({
  user: AuthUserResponseSchema,
  household: AuthHouseholdResponseSchema,
});

export interface AuthUserResponse {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface AuthHouseholdResponse {
  id: string;
  name: string;
  role: string;
}

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
}

export interface AuthSessionResponse {
  user: AuthUserResponse;
  household: AuthHouseholdResponse;
  tokens: AuthTokensResponse;
}

export interface CurrentIdentityResponse {
  user: AuthUserResponse;
  household: AuthHouseholdResponse;
}

export interface AuthenticatedPrincipal {
  userId: string;
  email: string;
}

export interface AuthenticatedRequest {
  headers: Record<string, string | string[] | undefined>;
  auth?: AuthenticatedPrincipal;
}
