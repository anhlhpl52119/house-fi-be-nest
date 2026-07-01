# 0009 Auth Boundary

Date: 2026-07-01

## Status

Accepted

## Context

US-002 introduces email/password authentication, JWT access tokens, refresh-token persistence, and current-user household context. `PLAN.md` allows either Argon2 or bcrypt for password hashing and says refresh-token rotation is optional. These choices affect security behavior, public auth contracts, and future authorization boundaries, so they need a durable decision before implementation.

## Decision

Use Argon2 for password hashing.

Use opaque refresh tokens that are stored only as hashes in the `refresh_tokens` table. Refresh tokens rotate on each successful refresh: the old token row is revoked and a new token is issued and persisted. Logout revokes the submitted refresh token when it exists.

Use JWT access tokens for authenticated API requests. Access-token payloads carry the minimum identity needed to resolve current user and household context server-side; business endpoints must still load and verify membership rather than trusting request body household IDs.

Registration creates the user, default household, and owner household membership in one database transaction.

## Alternatives Considered

1. Use bcrypt.
   - Rejected because Argon2 is the stronger modern default for password hashing.
2. Store refresh tokens directly.
   - Rejected because database disclosure would expose live session credentials.
3. Do not rotate refresh tokens.
   - Rejected because rotation reduces replay risk with a small implementation cost.
4. Put household IDs in request bodies for later APIs.
   - Rejected because the product requires household-scoped access based on authenticated membership.

## Consequences

Positive:

- Password and session secrets have clear handling rules.
- Refresh token replay risk is reduced by rotation and revocation.
- Later finance APIs can build on a stable authenticated user and household context.

Tradeoffs:

- Argon2 adds a native dependency.
- Refresh rotation requires transactional token lifecycle handling.
- Full integration proof needs a repeatable Postgres test database setup.

## Follow-Up

- Add rate limiting, password reset, email verification, and MFA only when explicitly selected for later stories.
- Add invite/member-management flow in a separate household story.
- Add integration/E2E auth tests once the repository has a repeatable test database harness.
