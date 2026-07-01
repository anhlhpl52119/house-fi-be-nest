# Validation

## Proof Strategy

US-006 is done when TypeScript compilation proves the new module contracts, unit tests cover Zod credit-card validation, and API proof shows pending credit-card spending can be created and resolved into generated cash payments without mutating cash balance prematurely.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | Zod schemas accept valid create/list/resolve/payment-query inputs and reject invalid amount, date, UUID, status, and inverted ranges. |
| Integration | Create credit-card transaction; enforce household-scoped category/member validation; resolve one pending transaction into linked payment and cash transaction; reject double resolve. |
| E2E | Register/login, list categories, create credit-card transaction, list pending transactions, resolve it, list payments, and verify cash balance changes only after resolution. |
| Platform | `/health` remains available; `npm run lint`, `npm run build`, and `npm test` pass. |
| Performance | Not required for this MVP slice. |
| Logs/Audit | Harness trace records validation evidence; product audit log remains out of scope. |

## Fixtures

- Owner account for smoke: `owner-us006@example.com`.
- Member account for optional filter coverage: `member-us006@example.com`.
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
# Start server and smoke /api/v1/auth/register, /api/v1/categories, /api/v1/credit-cards/*, and /api/v1/cash-transactions/balance.
```

## Acceptance Evidence

2026-07-01:

- `npm run lint` passed.
- `npm run build` passed.
- `npm test` passed with 16 total schema unit tests, including 5 credit-card schema tests.
- `DATABASE_URL=postgres://postgres:postgres@localhost:5432/us006_smoke_db npm run db:migrate` passed against an isolated Postgres smoke database.
- API smoke passed against the isolated Postgres database:
  - registered owner `owner-us006-1782918587543@example.com`;
  - listed seeded expense categories;
  - verified initial cash balance stayed `0` before settlement;
  - created one pending credit-card transaction for `350000` VND;
  - listed the transaction through the default pending view;
  - resolved the transaction into one credit-card payment and one generated cash transaction;
  - verified the pending view became empty and the resolved view linked `resolved_payment_id` correctly;
  - listed one credit-card payment linked to the generated cash transaction;
  - verified cash balance changed only after settlement to `expense=350000`, `balance=-350000`.
- The isolated smoke database was dropped after validation.
