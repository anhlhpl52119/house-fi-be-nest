# Design

## Domain Model

`assets` are household-scoped definitions for tracked holdings.

Rules:

- `type` is one of `gold`, `stock`, or `crypto`.
- `name` and `unit` are required trimmed strings.
- `symbol` is optional and stored trimmed when present.
- new assets start active and keep `createdByUserId` from the authenticated request.
- only active assets can receive new transactions.

`asset_transactions` are immutable buy/sell ledger records.

Rules:

- `type = buy` increases derived holding quantity and creates an expense cash transaction.
- `type = sell` decreases derived holding quantity and creates an income cash transaction.
- `quantity` is a positive decimal string with at most 10 fractional digits.
- `unitPrice` and `totalAmount` are positive VND integers.
- `assetId`, `paidByUserId`, and all resulting records must stay inside the authenticated user's household boundary.
- sells must not reduce the derived holding below zero.
- each asset transaction links exactly one generated cash transaction with `source_type = asset_transaction` and `source_id = asset_transaction.id`.

## Application Flow

Commands:

- Create asset definition.
- Record asset transaction and generated cash movement transactionally.

Queries:

- List active assets for the current household with optional type filter.
- Get one active asset with derived current quantity.
- List asset transactions for the current household with asset/type/date/paid-by filters.

Record transaction flow:

1. Resolve the current household membership.
2. Load the active asset inside the current household.
3. Validate optional paid-by user inside the current household boundary.
4. For sells, derive current quantity and reject if the sell would create a negative holding.
5. Insert the asset transaction with `cashTransactionId = null`.
6. Insert the generated cash transaction:
   - `type = expense` for buy, `income` for sell;
   - `amount = totalAmount`;
   - `transactionDate = transactionDate`;
   - `sourceType = asset_transaction`;
   - `sourceId = null` initially.
7. Update the asset transaction with the generated `cashTransactionId`.
8. Backfill the cash transaction `sourceId` to the asset transaction id.

## Interface Contract

Routes under `/api/v1`:

- `GET /assets`
- `POST /assets`
- `GET /assets/:id`
- `GET /assets/transactions`
- `POST /assets/:id/transactions`

Request bodies and query params use Zod validation. Responses are wrapped in `{ data: ... }`.

Create asset body:

```json
{
  "type": "gold",
  "symbol": "SJC",
  "name": "Vàng SJC",
  "unit": "chỉ"
}
```

List asset filters:

```text
type?
```

Create asset transaction body:

```json
{
  "type": "buy",
  "quantity": "2.5",
  "unitPrice": 8000000,
  "totalAmount": 20000000,
  "transactionDate": "2026-07-10",
  "paidByUserId": "uuid",
  "note": "Mua vàng"
}
```

List transaction filters:

```text
assetId?
type?
fromDate?
toDate?
paidByUserId?
```

Expected errors:

- `400` for invalid input, non-positive numbers, malformed decimals, or inverted date filters.
- `401` for missing/invalid auth.
- `403` when a paid-by user is outside the household.
- `404` when the requested asset is outside the current household or inactive.
- `409` when a sell would make the derived holding negative.

## Data Model

Use the existing `assets`, `asset_transactions`, and `cash_transactions` tables already present in the schema.

No schema migration is expected for the first slice.

## UI / Platform Impact

No frontend implementation in this repo. The API shape supports a future asset list, asset detail, and buy/sell form.

## Observability

Harness trace records proof. Product audit logging is still out of scope.

## Alternatives Considered

1. Store mutable holding quantity on `assets`.
   - Rejected because product rules prefer derived report values from ledgers.
2. Allow sell transactions without checking current holding quantity.
   - Rejected because it would allow negative holdings in the MVP without an explicit short-selling concept.
3. Calculate realized PnL in US-008.
   - Rejected because the product contract explicitly defers realized PnL for MVP assets.
