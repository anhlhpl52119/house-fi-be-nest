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
