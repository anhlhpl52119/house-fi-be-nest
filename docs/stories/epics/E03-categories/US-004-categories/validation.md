# Validation

## Proof Strategy

US-004 is done when TypeScript compilation proves the new module contracts, unit tests cover Zod category validation, build succeeds, and migration/schema proof shows the seed data can be applied to Postgres.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | Zod schemas accept valid category create/update/query inputs and reject invalid type, UUID, empty name, and bad colors. |
| Integration | Create/list/update/delete custom categories; reject system category mutation; enforce same-type parent and max depth. |
| E2E | Register/login, list seeded system categories, create custom child category, update it, delete it. |
| Platform | `/health` remains available outside the API prefix; `npm run lint`, `npm run build`, and `npm test` pass. |
| Performance | Not required for this MVP slice. |
| Logs/Audit | Harness trace records validation evidence; product audit log is not implemented yet. |

## Fixtures

- System categories from the user-provided Vietnamese expense/income hierarchy.
- Owner account for optional smoke: `owner-us004@example.com`.

## Commands

```text
npm run lint
npm run build
npm test
```

Optional when Postgres is available:

```text
npm run db:migrate
# Start server and smoke /api/v1/auth/register and /api/v1/categories.
```

## Acceptance Evidence

2026-07-01:

- `npm run lint` passed.
- `npm run build` passed.
- `npm test` passed with 6 schema unit tests.
- `npm run db:migrate` passed against an isolated Postgres smoke database.
- Isolated migration proof showed 47 seeded system categories: 32 expense and 15 income rows.
- API smoke passed against an isolated Postgres database:
  - registered owner;
  - listed 32 seeded expense categories through `GET /api/v1/categories?type=expense`;
  - created a custom household child category under the system `Di chuyển` parent;
  - updated the custom category name;
  - soft-deleted the custom category;
  - rejected mutation of a system category with `403`.
- Isolated smoke databases were dropped after validation.
- `scripts/bin/harness-cli story verify US-004` passed after the final code changes.
