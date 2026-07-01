# Validation

## Proof Strategy

US-003 is done when TypeScript compilation proves the new module contracts, lint passes, and API-level smoke or tests demonstrate owner-only member creation and member listing when a Postgres database is available.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | Zod request validation accepts valid create-member body and rejects invalid email/password/display name. |
| Integration | Owner can create a second member; duplicate email is rejected; non-owner cannot create members; household cannot exceed two active members. |
| E2E | Register owner, create member, login as member, list members. |
| Platform | `/health` remains available outside the API prefix. |
| Performance | Not required for this small MVP slice. |
| Logs/Audit | Harness trace records validation evidence; product audit log is not implemented yet. |

## Fixtures

- Owner account: `owner-us003@example.com`.
- Member account: `member-us003@example.com`.
- Initial member password with at least 8 characters.

## Commands

```text
npm run lint
npm run build
npm test
```

Optional when Postgres is available:

```text
npm run db:migrate
# Start server and smoke /api/v1/auth/register, /api/v1/households/members, /api/v1/auth/login.
```

## Acceptance Evidence

2026-07-01:

- `npm run lint` passed.
- `npm run build` passed.
- `npm test` passed with 2 schema unit tests.
- `npm run db:migrate` passed against isolated Postgres smoke databases.
- API smoke passed against isolated databases, including a rerun after adding the household row lock:
  - owner registered;
  - owner created member through `POST /api/v1/households/members`;
  - owner listed two active members;
  - member logged in through `POST /api/v1/auth/login`;
  - member listed two active members;
  - non-owner member create attempt returned `403`;
  - owner over-limit member create attempt returned `409`.
- Isolated smoke databases were dropped after validation.
- `scripts/bin/harness-cli story verify US-003` passed after the final code changes.
