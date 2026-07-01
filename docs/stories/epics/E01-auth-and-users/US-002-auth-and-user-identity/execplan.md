# US-002 Auth and User Identity Exec Plan

## Goal

Implement the minimum safe authentication and identity foundation needed for later household-scoped finance APIs.

## Scope

In scope:

- Create `src/auth/` NestJS module, controller, service, DTO schemas, and guard support.
- Add email/password registration and login.
- Add JWT access token issuance and verification.
- Add persisted refresh-token issuance, hashing, revocation, and rotation.
- Add logout and current-user (`/auth/me`) endpoints.
- Create the registering user's default household and owner membership in a database transaction.
- Update product/story/validation Harness records.

Out of scope:

- Invite or second-member management flow.
- Password reset, email verification, MFA, and rate limiting.
- Full authorization decorators for every future domain endpoint.
- Category seeding or financial domain APIs.
- OpenAPI/Swagger generation.

## Risk Classification

Risk flags:

- Auth: registration, login, JWT access token, refresh token, logout.
- Authorization: current user and household membership context establish later access boundaries.
- Data model: writes to existing user, household, household member, and refresh-token tables.
- Audit/security: password and token secret handling.
- Public contracts: new `/auth/*` API surface and response shape.
- Weak proof: integration/E2E database proof is not yet fully established.

Hard gates:

- Auth.
- Authorization.
- Audit/security.

Lane: high-risk.

## Work Phases

1. Discovery
   - Confirm US-001 schemas and NestJS module patterns.
   - Confirm validation commands and available test runner.
2. Design
   - Create high-risk story packet.
   - Record `0009-auth-boundary` decision for Argon2 and rotating hashed refresh tokens.
3. Validation planning
   - Define quick proof (`npm run lint`, `npm run build`).
   - Add focused unit tests if the current test setup can support them without large scaffolding.
4. Implementation
   - Add auth dependencies.
   - Implement DTO parsing with Zod at controller boundaries.
   - Implement auth service and token lifecycle.
   - Wire AuthModule into AppModule.
5. Verification
   - Run dependency install if needed.
   - Run lint/build and any focused tests added.
   - Run migration generation only if schema changes occur; no schema changes are expected.
6. Harness update
   - Update durable story evidence and proof flags.
   - Update backlog and product docs if the implementation changes product truth.
   - Record trace with files changed, validation, and friction.

## Stop Conditions

Pause for human confirmation if:

- The implementation would require changing existing database schema semantics.
- Auth behavior needs to deviate from the design in `design.md`.
- Validation requirements need to be weakened.
- Dependency installation fails or introduces incompatible versions.
- A real production secret-management decision is needed beyond local env variables.
