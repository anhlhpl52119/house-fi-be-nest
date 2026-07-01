# Validation

## Proof Strategy

US-007 is done when TypeScript compilation proves the new module contracts, unit tests cover Zod installment validation, and API proof shows installment plans generate scheduled payments while cash balance changes only when a payment is marked paid.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | Zod schemas accept valid create/list/detail/pay/upcoming inputs and reject invalid amount, UUID, status, and inverted or inconsistent dates. |
| Integration | Create installment plan; enforce household-scoped category/member validation; generate payment schedule; pay one pending installment into linked cash transaction; complete the plan when the last payment is paid; reject double pay and mismatched amount. |
| E2E | Register/login, list categories, create installment plan, inspect detail schedule, list upcoming pending payments, pay one installment, and verify cash balance changes only after payment. |
| Platform | `/health` remains available; `npm run lint`, `npm run build`, and `npm test` pass. |
| Performance | Not required for this MVP slice. |
| Logs/Audit | Harness trace records validation evidence; product audit log remains out of scope. |

## Fixtures

- Owner account for smoke: `owner-us007@example.com`.
- Member account for optional filter coverage: `member-us007@example.com`.
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
# Start server and smoke /api/v1/auth/register, /api/v1/categories, /api/v1/installments/*, and /api/v1/cash-transactions/balance.
```

## Acceptance Evidence

2026-07-01:

- `npm run lint` passed.
- `npm run build` passed.
- `npm test` passed with 21 total schema unit tests, including 5 installment schema tests.
- `DATABASE_URL=postgres://postgres:postgres@localhost:5432/us007_smoke_1782920456 npm run db:migrate` passed against an isolated Postgres smoke database.
- API smoke passed against the isolated Postgres database:
  - registered owner `owner-us007-us007_smoke_1782920456@example.com`;
  - listed seeded expense categories;
  - verified initial cash balance stayed `0` before any installment payment;
  - created one installment plan for `12,000,000` VND with 3 scheduled payments and verified due-date clamping from `2026-08-31` to `2026-09-30` and `2026-10-31`;
  - listed the plan through the default active view and fetched the plan detail schedule;
  - listed 3 pending upcoming installment payments;
  - paid the first installment and verified one generated cash transaction was linked;
  - verified double-pay on the same installment payment returned `409`;
  - verified cash balance changed only after payment to `expense=4,000,000`, `balance=-4,000,000`;
  - paid the remaining two scheduled installments and verified the plan became `completed` with no upcoming pending payments left;
  - verified final cash balance became `expense=12,000,000`, `balance=-12,000,000`.
- The isolated smoke database was dropped after validation.
