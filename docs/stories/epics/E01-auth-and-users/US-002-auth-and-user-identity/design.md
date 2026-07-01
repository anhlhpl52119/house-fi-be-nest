# US-002 Auth and User Identity Design

## Domain Model

Existing US-001 tables are sufficient for this story:

- `users`: stores account identity, normalized email, display name, password hash, avatar URL, active flag, and timestamps.
- `households`: stores the household container for all later finance records.
- `household_members`: links users to households and stores role (`owner` or `member`) and active membership state.
- `refresh_tokens`: stores hashed refresh tokens, expiry, revocation time, and user relationship.

Business rules:

- Email/password is the MVP auth mechanism.
- Email addresses are normalized before lookup and insert.
- Password hashes are generated with Argon2 and never exposed.
- Refresh tokens are opaque random secrets; only token hashes are persisted.
- Refresh token use rotates the token: revoke the old row and insert a new hashed token row.
- The MVP assumes one current household per user; resolve it from the active `household_members` row.
- Registration creates the first household and marks the registering user as `owner`.

## Application Flow

### Register

1. Parse request body with Zod.
2. Normalize email.
3. Check for existing user by email.
4. Hash password with Argon2.
5. In a database transaction:
   - create `users` row;
   - create default `households` row with `created_by_user_id` set to the new user;
   - create `household_members` row with `role = 'owner'`.
6. Issue access token and refresh token.
7. Persist hash of the refresh token.
8. Return user, household context, and tokens.

### Login

1. Parse request body with Zod.
2. Normalize email and find active user.
3. Verify submitted password against Argon2 hash.
4. Resolve current active household membership.
5. Issue access token and persisted refresh token.
6. Return user, household context, and tokens.

### Refresh

1. Parse submitted refresh token.
2. Hash and look up non-revoked, non-expired token row.
3. Resolve active user and current household membership.
4. Revoke old token row.
5. Issue and persist a new refresh token.
6. Return new access token and refresh token.

### Logout

1. Parse submitted refresh token.
2. Hash and revoke matching non-revoked token row if present.
3. Return success without exposing whether the token existed.

### Me

1. Verify Bearer JWT access token.
2. Load active user and current household membership.
3. Return user and household context.

## Interface Contract

Base path uses the existing global prefix: `/api/v1`.

### `POST /auth/register`

Request:

```json
{
  "email": "wife@example.com",
  "password": "correct horse battery staple",
  "displayName": "Wife"
}
```

Success: `201 Created`

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "wife@example.com",
      "displayName": "Wife",
      "avatarUrl": null
    },
    "household": {
      "id": "uuid",
      "name": "Wife Household",
      "role": "owner"
    },
    "tokens": {
      "accessToken": "jwt",
      "refreshToken": "opaque-token",
      "tokenType": "Bearer"
    }
  }
}
```

Errors:

- `400 Bad Request` for malformed JSON or validation failure.
- `409 Conflict` when email is already registered.

### `POST /auth/login`

Request:

```json
{
  "email": "wife@example.com",
  "password": "correct horse battery staple"
}
```

Success: `200 OK` with the same response envelope as register.

Errors:

- `400 Bad Request` for validation failure.
- `401 Unauthorized` for invalid credentials or inactive user.

### `POST /auth/refresh`

Request:

```json
{
  "refreshToken": "opaque-token"
}
```

Success: `200 OK` with new access and refresh tokens.

Errors:

- `400 Bad Request` for validation failure.
- `401 Unauthorized` for invalid, revoked, expired, or orphaned refresh token.

### `POST /auth/logout`

Request:

```json
{
  "refreshToken": "opaque-token"
}
```

Success: `204 No Content`.

### `GET /auth/me`

Headers:

```text
Authorization: Bearer <access-token>
```

Success: `200 OK`

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "wife@example.com",
      "displayName": "Wife",
      "avatarUrl": null
    },
    "household": {
      "id": "uuid",
      "name": "Wife Household",
      "role": "owner"
    }
  }
}
```

Errors:

- `401 Unauthorized` for missing, malformed, expired, or invalid access token.

## Data Model

No new tables are required for US-002. It uses the tables created in US-001:

- `users`
- `households`
- `household_members`
- `refresh_tokens`

Indexes already present for email lookup, household membership lookup, and refresh-token user lookup should support this slice. A token hash lookup index may be considered if refresh-token verification becomes slow, but it is not required for the two-user MVP unless validation identifies a problem.

## UI / Platform Impact

No frontend or platform shell changes are included. API consumers must store the access token for Bearer auth and the refresh token for session renewal/logout.

## Observability

- Do not log raw passwords, password hashes, access tokens, refresh tokens, or refresh token hashes.
- Later structured request logging should include authenticated `user_id` where available.
- Audit records are not implemented in US-002; later financial command stories should add product audit semantics if needed.

## Alternatives Considered

1. Use bcrypt for password hashing.
   - Rejected in favor of Argon2 as the modern default for password hashing.
2. Store refresh tokens in plaintext.
   - Rejected because token disclosure would allow session takeover.
3. Reuse a submitted refresh token without rotation.
   - Rejected because rotation narrows replay risk.
4. Create no default household on registration.
   - Rejected because later MVP APIs require household-scoped access immediately.
