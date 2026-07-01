# US-002 Auth and User Identity Overview

## Current Behavior

US-001 provides a runnable NestJS backend foundation, Drizzle schemas for `users`, `households`, `household_members`, and `refresh_tokens`, and a `/health` smoke endpoint. No auth module, user registration/login API, JWT guard, refresh-token workflow, or current-user endpoint exists yet.

## Target Behavior

US-002 establishes the authentication and identity foundation for later household-scoped finance APIs:

- Users can register with email, password, and display name.
- Registration creates the user, a default household, and an owner `household_members` row in one database transaction.
- Users can log in with email/password.
- The API issues short-lived JWT access tokens and persisted refresh tokens.
- Refresh tokens are stored only as hashes and rotate on refresh.
- Users can logout by revoking the submitted refresh token.
- Authenticated users can call `GET /auth/me` to retrieve their own user and current household membership context.
- Password hashes and refresh token hashes are never returned in API responses.

## Affected Users

- Household member registering the first account.
- Household member logging in and accessing later household-scoped APIs.
- Future domain APIs that need request identity and household membership context.

## Affected Product Docs

- `PLAN.md`
- `docs/product/personal-finance-mvp.md`
- `docs/decisions/0008-personal-finance-backend-foundation.md`
- `docs/decisions/0009-auth-boundary.md`

## Non-Goals

- Invite flow for adding the second household member.
- Password reset, email verification, MFA, or rate limiting.
- Multi-household selection.
- Role-management APIs beyond creating the first owner membership.
- Category seeding during registration; this can be handled by the categories story or a later household initialization story.
