# Assets API

Assets track gold, stock, and crypto definitions plus immutable buy/sell transactions. Routes require bearer auth.

## Rules

- Asset types are `gold`, `stock`, and `crypto`.
- Quantities are decimal strings, normalized by the API.
- Buy transactions create generated cash expenses.
- Sell transactions create generated cash income.
- Sells are rejected when they would reduce derived holding quantity below zero.
- Live prices, transfers, fees, splits, and PnL are out of scope.

## `GET /assets`

Lists active assets.

### Query

| Field | Type | Rules |
| --- | --- | --- |
| `type` | string | Optional `gold`, `stock`, or `crypto` |

## `POST /assets`

Creates an asset definition.

### Body

| Field | Type | Rules |
| --- | --- | --- |
| `type` | string | `gold`, `stock`, or `crypto` |
| `symbol` | string or null | Optional; 1-40 chars |
| `name` | string | 1-160 chars |
| `unit` | string | 1-40 chars |

## `GET /assets/{id}`

Fetches one asset with derived `currentQuantity`.

## `GET /assets/transactions`

Lists asset buy/sell ledger rows.

### Query

| Field | Type | Rules |
| --- | --- | --- |
| `assetId` | UUID | Optional |
| `type` | string | Optional `buy` or `sell` |
| `fromDate` / `toDate` | date | Optional transaction-date range |
| `paidByUserId` | UUID | Optional |

## `POST /assets/{id}/transactions`

Records an immutable buy or sell transaction.

### Body

| Field | Type | Rules |
| --- | --- | --- |
| `type` | string | `buy` or `sell` |
| `quantity` | string | Positive decimal string, up to 20 integer and 10 fractional digits |
| `unitPrice` | number | Positive safe integer VND |
| `totalAmount` | number | Positive safe integer VND |
| `transactionDate` | date | Business date |
| `paidByUserId` | UUID or null | Optional |
| `note` | string | Optional |
