# Validation

## Proof Strategy

US-005 is done when TypeScript compilation proves the new module contracts, unit tests cover Zod cash transaction validation, build succeeds, and migration/API proof shows household-scoped cash transactions work against Postgres.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | Zod schemas accept valid create/update/query inputs and reject invalid type, amount, date, UUID, note, source type, and inverted date ranges. |
| Integration | Create/list/read/update/soft-delete manual cash transactions; enforce current household scoping; reject invalid category type/ownership; reject invalid paid-by user. |
| E2E | Register/login, list categories, create expense/income cash transactions, filter by type/date/user/category, read balance, update one, delete one. |
| Platform | `/health` remains available outside the API prefix; `npm run lint`, `npm run build`, and `npm test` pass. |
| Performance | Not required for this MVP slice. |
| Logs/Audit | Harness trace records validation evidence; product audit log is not implemented yet. |

## Fixtures

- Owner account for optional smoke: `owner-us005@example.com`.
- Member account for optional smoke: `member-us005@example.com`.
- System income category such as `Lương`.
- System expense category such as `Ăn uống`.

## Commands

```text
npm run lint
npm run build
npm test
```

Optional when Postgres is available:

```text
npm run db:migrate
# Start server and smoke /api/v1/auth/register, /api/v1/categories, and /api/v1/cash-transactions.
```

## Acceptance Evidence

2026-07-01:

- `npm run lint` passed.
- `npm run build` passed.
- `npm test` passed with 11 schema unit tests, including 5 cash transaction schema tests.
- `npm run db:generate` produced `src/database/migrations/0002_us005_cash_transactions.sql` for cash transaction soft delete and source indexing.
- `npm run db:migrate` passed against an isolated Postgres smoke database.
- API smoke passed against an isolated Postgres database:
  - registered owner;
  - listed seeded income/expense system categories;
  - rejected an expense cash transaction using an income category with `400`;
  - created manual expense and income cash transactions;
  - returned derived balance `income=1000000`, `expense=120000`, `balance=880000`;
  - filtered manual expense by type/date/category/paid-by/source;
  - read one transaction by id;
  - updated expense amount/note;
  - soft-deleted income and recomputed balance excluding the deleted record.
- Isolated smoke database was dropped after validation.
