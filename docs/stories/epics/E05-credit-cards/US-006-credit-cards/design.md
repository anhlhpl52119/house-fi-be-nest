# Design

## Domain Model

`credit_card_transactions` represent spending incurred at swipe time and do not affect cash balance directly.

Rules:

- amount is a positive integer VND amount.
- transaction_date is the incurred spending date.
- category_id is optional, but if present must be an active accessible `expense` category.
- paid_by_user_id is optional, but if present must be an active member of the current household.
- created_by_user_id and household_id come from the authenticated request.
- new credit-card transactions start in `pending` status.
- one transaction can be resolved exactly once.
- resolving creates one `credit_card_payments` row and one generated `cash_transactions` expense row.
- the generated cash transaction uses `source_type = credit_card_payment` and `source_id = credit_card_payments.id`.
- generated credit-card-payment cash transactions are not mutable through the manual cash-transactions API.

For this MVP slice, settlement amount is always the full credit-card transaction amount. Partial settlement is deferred.

## Application Flow

Commands:

- Create credit-card transaction.
- Resolve one pending credit-card transaction into a payment plus generated cash transaction.

Queries:

- List credit-card transactions for the current household with status/date/category/paid-by filters; default to `pending` when status is omitted.
- List credit-card payments for the current household with optional transaction/date filters.

Resolve flow:

1. Lock the selected credit-card transaction in the current household.
2. Reject if the transaction is not `pending`.
3. Insert generated cash transaction:
   - `type = expense`
   - `amount = credit_card_transaction.amount`
   - `transaction_date = paymentDate`
   - `source_type = credit_card_payment`
   - `source_id` backfilled to the created payment id
4. Insert `credit_card_payments` row.
5. Update the credit-card transaction to `resolved`, set `resolved_payment_id`, and set `resolved_at`.

## Interface Contract

Routes under `/api/v1`:

- `POST /credit-cards/transactions`
- `GET /credit-cards/transactions`
- `POST /credit-cards/transactions/:id/resolve`
- `GET /credit-cards/payments`

Request bodies and query params use Zod validation. Responses are wrapped in `{ data: ... }`.

Create transaction body:

```json
{
  "amount": 350000,
  "transactionDate": "2026-07-01",
  "categoryId": "uuid",
  "paidByUserId": "uuid",
  "expectedPaymentDate": "2026-08-10",
  "note": "Siêu thị"
}
```

List transaction filters:

```text
status? default pending
fromDate
toDate
categoryId
paidByUserId
expectedPaymentFrom
expectedPaymentTo
```

Resolve body:

```json
{
  "paymentDate": "2026-08-10",
  "note": "Paid from household cash"
}
```

Payment list filters:

```text
creditCardTransactionId
fromDate
toDate
```

Expected errors:

- `400` for invalid input or business-date inconsistencies.
- `401` for missing/invalid auth.
- `403` when a member references a category or paid-by user outside the household.
- `404` when the requested transaction is outside the current household or missing.
- `409` when attempting to resolve a non-pending credit-card transaction.

## Data Model

Use the existing `credit_card_transactions`, `credit_card_payments`, and `cash_transactions` tables already present in the schema.

No schema change is expected unless implementation reveals a missing constraint that blocks the MVP flow.

## UI / Platform Impact

No frontend implementation in this repo. The API shape supports a future pending-transactions screen and a settlement action.

## Observability

Harness trace records proof. Product audit logging is still out of scope.

## Alternatives Considered

1. Model credit-card spending as normal cash transactions.
   - Rejected because swipe-time spending and cash settlement happen at different times and would break report semantics.
2. Allow arbitrary partial payments in US-006.
   - Rejected because the MVP plan chooses per-transaction full resolution and the schema enforces one payment per credit-card transaction.
3. Reuse the manual cash-transactions create endpoint for settlements.
   - Rejected because settlement must atomically create a payment record and mark the originating credit-card transaction resolved.
