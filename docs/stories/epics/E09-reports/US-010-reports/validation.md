# US-010 Reports Validation

## Proof Strategy

US-010 is done when TypeScript compilation proves the report module contracts, unit tests cover Zod report query validation, and API smoke proves reports are derived from seeded ledger workflows without double-counting generated settlement/payment/savings/asset cash rows as spending incurred.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | Zod schemas accept valid report filters and reject invalid month/date ranges/UUIDs. |
| Integration | Isolated Postgres migration succeeds. |
| E2E | Register owner; create representative manual cash, credit-card, installment, asset, and saving records; call each report endpoint and verify household-scoped totals. |
| Platform | `/health` remains healthy after reports module registration. |
| Performance | MVP-scale in-memory aggregation only; no separate benchmark required. |
| Logs/Audit | No audit records expected; reports are read-only. |

## Fixtures

- Owner account for smoke: `owner-us010@example.com`.
- Monthly reporting window: July 2026.
- Cash manual expense: `500000` VND.
- Credit-card spending: `2000000` VND, pending/resolved in August.
- Installment original amount: `12000000` VND, first due August 2026.
- Asset buy/sell ledger rows for one gold asset.
- Saving deposit principal `100000000` VND with maturity in January 2027.

## Commands

```text
npm run lint
npm run build
npm test
scripts/bin/harness-cli story verify US-010
DATABASE_URL=postgres://postgres:postgres@localhost:5432/us010_smoke_<timestamp> npm run db:migrate
```

## Acceptance Evidence

- `npm run lint` passed.
- `npm run build` passed.
- `npm test` passed with 40 schema tests, including 7 report schema tests.
- `scripts/bin/harness-cli story verify US-010` passed, running `npm run lint && npm run build && npm test`.
- `DATABASE_URL=postgres://postgres:postgres@localhost:5432/us010_smoke_<timestamp> npm run db:migrate` passed against an isolated Postgres smoke database.
- API smoke passed against the isolated database with:
  - registered owner `owner-us010-<timestamp>@example.com`;
  - manual July cash expense `500000` VND;
  - July credit-card spending `2000000` VND with August expected payment;
  - July installment original amount `12000000` VND with August pending payment `2000000` VND;
  - gold asset buy `2.5` quantity for `20000000` VND;
  - saving deposit principal `100000000` VND with expected interest `3250000` VND.
- Smoke report assertions passed:
  - monthly spending total `14500000` VND split into manual cash `500000`, credit card `2000000`, and installment `12000000`;
  - July cash-flow expense `120500000` VND and net `-120500000` VND, proving asset and savings cash movements affect cash flow but not spending incurred;
  - August upcoming obligations total `4000000` VND;
  - asset summary total buy amount `20000000` VND and current quantity `2.5`;
  - savings summary active principal `100000000` VND and active expected interest `3250000` VND.
