# US-013 Household Settings Validation

## Proof Strategy

Before the story is marked implemented, prove the route contract, authorization rule, and no-regression build path. The highest-value proof is an isolated Postgres API smoke that creates an owner, creates/logs in a member, verifies owner rename success, and verifies member rename rejection.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | Zod schema accepts a valid name, trims/rejects blank names, rejects names over 160 characters, and rejects unknown fields. |
| Integration | `npm run lint`, `npm run build`, and `npm test` pass after adding the endpoint. |
| E2E | Isolated Postgres API smoke: owner registers, owner creates member, member logs in, owner `PATCH /api/v1/households/current` succeeds, member `PATCH /api/v1/households/current` returns `403`, and subsequent `GET /api/v1/households/current` reflects the updated name for both users. |
| Platform | Start the Nest app against the isolated database and fetch `/health` plus the household endpoints through HTTP. |
| Performance | Not required for this narrow settings mutation. |
| Logs/Audit | Confirm no stack traces or SQL details leak in validation/authorization errors. Product audit logs are out of scope. |

## Fixtures

- Owner user: `owner-us013@example.com`, display name `Owner US013`.
- Member user: `member-us013@example.com`, display name `Member US013`.
- Updated household name: `Gia đình US-013`.
- Isolated Postgres database using the same migration path as prior story smoke tests.

## Commands

Expected commands after implementation:

```text
npm run lint
npm run build
npm test
scripts/bin/harness-cli story verify US-013
```

Configure `story verify` after implementation with the command that represents the final repeatable proof, likely `npm run lint && npm run build && npm test` plus documented isolated smoke evidence.

## Acceptance Evidence

- `npm run lint && npm run build && npm test` passed with 44 schema tests, including `UpdateCurrentHouseholdRequestSchema` cases for trimming valid names, rejecting blank names, rejecting names over 160 characters, and rejecting unknown fields.
- `scripts/bin/harness-cli story verify US-013` passed with the configured `npm run lint && npm run build && npm test` proof.
- Runtime OpenAPI smoke confirmed `/api/docs-json` includes `PATCH /api/v1/households/current` with a request body.
- `DATABASE_URL=postgres://postgres:postgres@localhost:55432/us013_smoke_1783548246 npm run db:migrate` passed against an isolated Docker Postgres 16 database.
- API smoke passed against the isolated database and Nest app on `PORT=31313`:
  - `/health` returned successfully;
  - owner `owner-us013-1783548271006@example.com` registered;
  - owner created member `member-us013-1783548271006@example.com`;
  - member logged in through the existing auth API;
  - owner `PATCH /api/v1/households/current` with padded name succeeded and returned trimmed name `Gia đình US-013` with role `owner`;
  - member `PATCH /api/v1/households/current` returned `403 Forbidden` without stack trace or SQL details;
  - owner and member `GET /api/v1/households/current` both returned `Gia đình US-013` with their respective roles;
  - invalid blank-name request returned `400` without stack trace details.
