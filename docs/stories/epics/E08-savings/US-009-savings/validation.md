# Validation

## Proof Strategy

US-009 is done when TypeScript compilation proves the new module contracts, unit tests cover Zod savings validation, and API proof shows saving deposit creation/maturity create linked cash movements while cash balance reflects deposit outflow and maturity inflow.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | Zod schemas accept valid create/list/mature inputs and reject invalid UUIDs, unsupported status, invalid dates/date ranges, unsafe VND amounts, negative interest, excessive decimal scale, empty text, and invalid maturity/start ordering. |
| Integration | Create deposit with generated expense cash transaction; list/fetch household savings; mature deposit with generated income cash transaction; reject double maturity; enforce household-scoped paid-by user validation. |
| E2E | Register/login, create saving deposit, verify cash balance decreases by principal, mature deposit, verify status/link fields and cash balance increases by principal plus interest, list saving-generated cash transactions. |
| Platform | `/health` remains available; `npm run lint`, `npm run build`, and `npm test` pass. |
| Performance | Not required for this MVP slice. |
| Logs/Audit | Harness trace records validation evidence; product audit log remains out of scope. |

## Fixtures

- Owner account for smoke: `owner-us009@example.com`.
- Saving fixture: bank `Techcombank`, principal `100000000`, interest rate `6.5`, start `2026-07-01`, planned maturity `2027-01-01`, actual interest `3250000`.

## Commands

```text
npm run lint
npm run build
npm test
```

Optional when Postgres is available:

```text
npm run db:migrate
# Start server and smoke /api/v1/auth/register, /api/v1/savings/deposits*, and /api/v1/cash-transactions/balance.
```

## Acceptance Evidence

2026-07-02:

- `npm run lint` passed.
- `npm run build` passed.
- `npm test` passed with 33 total schema unit tests, including 6 savings schema tests.
- `scripts/bin/harness-cli story verify US-009` passed, running `npm run lint && npm run build && npm test`.
- `DATABASE_URL=postgres://postgres:postgres@localhost:5432/us009_smoke_<timestamp> npm run db:migrate` passed against an isolated Postgres smoke database.
- API smoke passed against the isolated Postgres database:
  - registered owner `owner-us009-smoke@example.com`;
  - verified initial cash balance was `0`;
  - created Techcombank saving deposit with principal `100,000,000`, interest rate `6.5`, and linked generated deposit cash transaction;
  - verified cash balance became `expense=100,000,000`, `balance=-100,000,000` after deposit creation;
  - listed the active saving deposit;
  - matured the deposit with actual interest `3,250,000` and verified linked generated maturity cash transaction;
  - verified double maturity returned `409`;
  - verified final cash balance became `income=103,250,000`, `expense=100,000,000`, `balance=3,250,000`;
  - verified generated cash transaction lists for `saving_deposit` and `saving_maturity` each included one row with `sourceId` pointing to the saving deposit.
- The isolated smoke database was dropped after validation.
