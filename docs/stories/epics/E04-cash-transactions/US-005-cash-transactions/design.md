# Design

## Domain Model

`cash_transactions` represent real cash-impacting household ledger entries.

Rules:

- `type` is `income` or `expense`.
- `amount` is a positive integer VND amount.
- `transaction_date` is a business date (`yyyy-mm-dd`).
- Records are scoped to the authenticated user's current household.
- `created_by_user_id` is derived from the authenticated user, not request input.
- `paid_by_user_id` is optional, but if present must be an active member of the same household.
- `category_id` is optional, but if present must be an active income/expense category matching `type`; system categories and same-household custom categories are valid.
- User-created cash entries use `source_type = manual`.
- Generated business flows may later use `source_type` values such as `credit_card_payment`, `installment_payment`, `asset_transaction`, `saving_deposit`, and `saving_maturity`; US-005 does not create those flows.
- Delete is soft-delete by setting `is_active = false`.

## Application Flow

Commands:

- Create a manual cash transaction in the current household.
- Update mutable manual cash transaction fields.
- Soft-delete a manual cash transaction.

Queries:

- List active cash transactions for the current household with optional filters.
- Read one active cash transaction by id.
- Return a derived cash balance summary for the current household.

## Interface Contract

Routes under `/api/v1`:

- `GET /cash-transactions`
- `POST /cash-transactions`
- `GET /cash-transactions/balance`
- `GET /cash-transactions/:id`
- `PATCH /cash-transactions/:id`
- `DELETE /cash-transactions/:id`

Request bodies and query params use Zod validation. Responses are wrapped in `{ data: ... }`.

Create body:

```json
{
  "type": "expense",
  "amount": 120000,
  "transactionDate": "2026-07-01",
  "categoryId": "uuid",
  "paidByUserId": "uuid",
  "note": "Ăn tối"
}
```

List filters:

```text
type
fromDate
toDate
categoryId
paidByUserId
sourceType
```

Expected errors:

- `400` for invalid input.
- `401` for missing/invalid auth.
- `403` when a member references a category or paid-by user outside the household.
- `404` when a cash transaction does not exist in the current household or is inactive.
- `409` when trying to mutate a generated/non-manual cash transaction.

## Data Model

US-005 may extend `cash_transactions` with:

- `is_active boolean not null default true` for soft deletion.
- indexes for household/date, household/type/date, household/paid-by/date, and household/source.
- source type check values aligned to planned business flows.

Existing foundation columns remain:

- `household_id`
- `type`
- `amount`
- `transaction_date`
- `category_id`
- `paid_by_user_id`
- `created_by_user_id`
- `note`
- `source_type`
- `source_id`
- timestamps

## UI / Platform Impact

No frontend implementation. The API shape supports future mobile/browser forms and ledgers.

## Observability

Harness trace records validation evidence. Product audit logging is not implemented yet.

## Alternatives Considered

1. Add full reports in the same slice.
   - Rejected because report semantics span credit cards, installments, assets, and savings; US-005 keeps the slice to cash ledger and basic balance.
2. Hard-delete cash records.
   - Rejected because financial ledger records should avoid destructive deletes in the MVP.
