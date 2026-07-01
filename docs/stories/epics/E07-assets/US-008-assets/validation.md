# Validation

## Proof Strategy

US-008 is done when TypeScript compilation proves the new module contracts, unit tests cover Zod asset validation, and API proof shows buy/sell asset transactions create linked cash movements while derived holdings update from the transaction ledger.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | Zod schemas accept valid create/list/detail/transaction inputs and reject invalid UUIDs, unsupported types, malformed decimal quantities, unsafe VND amounts, empty text, and inverted dates. |
| Integration | Create asset; list/fetch household assets; create buy transaction with generated expense cash transaction; create sell transaction with generated income cash transaction; reject sell above current holding; enforce household-scoped paid-by user validation. |
| E2E | Register/login, create asset, buy quantity, verify cash balance decreases, sell partial quantity, verify holding quantity and cash balance, list asset transactions. |
| Platform | `/health` remains available; `npm run lint`, `npm run build`, and `npm test` pass. |
| Performance | Not required for this MVP slice. |
| Logs/Audit | Harness trace records validation evidence; product audit log remains out of scope. |

## Fixtures

- Owner account for smoke: `owner-us008@example.com`.
- Asset fixture: `Vàng SJC`, type `gold`, unit `chỉ`, symbol `SJC`.

## Commands

```text
npm run lint
npm run build
npm test
```

Optional when Postgres is available:

```text
npm run db:migrate
# Start server and smoke /api/v1/auth/register, /api/v1/assets*, and /api/v1/cash-transactions/balance.
```

## Acceptance Evidence

2026-07-02:

- `npm run lint` passed.
- `npm run build` passed.
- `npm test` passed with 27 total schema unit tests, including 6 asset schema tests.
- `DATABASE_URL=postgres://postgres:postgres@localhost:5432/us008_smoke_1782929838 npm run db:migrate` passed against an isolated Postgres smoke database.
- API smoke passed against the isolated Postgres database:
  - registered owner `owner-us008-us008_smoke_1782929838@example.com`;
  - verified initial cash balance was `0`;
  - created gold asset `Vàng SJC` with `currentQuantity = 0`;
  - recorded buy transaction for `2.5` quantity and verified one generated cash transaction was linked;
  - verified asset current quantity became `2.5` and cash balance became `expense=20,000,000`, `balance=-20,000,000`;
  - recorded sell transaction for `1.25` quantity and verified one generated cash transaction was linked;
  - verified asset current quantity became `1.25` and cash balance became `income=11,000,000`, `expense=20,000,000`, `balance=-9,000,000`;
  - verified oversell returned `409`;
  - listed 2 asset transactions for the asset.
- The isolated smoke database was dropped after validation.
