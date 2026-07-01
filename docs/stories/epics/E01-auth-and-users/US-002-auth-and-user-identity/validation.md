# US-002 Auth and User Identity Validation

## Proof Strategy

US-002 must prove that auth code compiles, boundary schemas are type-safe, and the NestJS app can build with the new module wired in. Because auth is high-risk, executable tests should cover token and password behavior where the current project setup allows it. Database-backed integration proof may be deferred only if a repeatable test database setup is not yet available; that gap must stay visible in durable story evidence.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | Zod DTO validation rejects malformed auth requests; password hashing/verifying works; access token signing/verification preserves user identity claims; refresh token hashing is deterministic for lookup without storing raw tokens. |
| Integration | Register creates user, household, owner membership, and refresh token in one transaction; login rejects bad credentials; refresh revokes old token and creates a new token; logout revokes token; `/auth/me` resolves active user and household context. |
| E2E | API-level flow: register → me → refresh → logout → rejected refresh. |
| Platform | `npm run lint`; `npm run build`; optional `/health` smoke remains unaffected. |
| Performance | Not required for the two-user MVP. |
| Logs/Audit | Confirm implementation does not log passwords, access tokens, refresh tokens, or token hashes. Product audit records are out of scope. |

## Fixtures

- First user: `wife@example.com`, display name `Wife`.
- Duplicate email attempt for conflict validation.
- Invalid login password for unauthorized validation.
- Expired/revoked refresh token rows for refresh rejection if integration tests are added.

## Commands

Planned commands:

```text
npm run lint
npm run build
npm test (if focused tests are added and compiled)
scripts/bin/harness-cli story verify US-002 (after a verify command is configured)
```

## Acceptance Evidence

Verified on 2026-07-01:

- `npm run lint` passed.
- `npm run build` passed.
- `npm test` passed with 0 compiled tests.
- `/health` smoke passed on port 3000 after build.
- Created isolated local Postgres database `house_fi_us002_test`, ran `DATABASE_URL=postgres://postgres:postgres@localhost:5432/house_fi_us002_test npm run db:migrate`, and migrations applied successfully.
- Auth API E2E smoke passed against the isolated database on port 3010: register returned user/household/tokens without password hash, `GET /auth/me` returned owner household context, refresh rotated the refresh token, logout revoked the rotated token, and a subsequent refresh attempt returned `401`.

Notes:

- No focused unit tests were added in this slice, so unit proof remains `no` in the durable matrix.
- The default local `postgres` database already contained unrelated legacy tables, so migration proof used an isolated disposable database instead.
