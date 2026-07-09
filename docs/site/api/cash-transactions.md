# Cash Transactions API

Cash transactions represent real cash-impacting income and expense ledger rows. Routes require bearer auth.

## Rules

- `type` is `income` or `expense`.
- Amounts are positive integer VND values.
- Manual cash transactions can be updated and soft-deleted.
- Generated cash transactions are created by other workflows and carry `sourceType`/`sourceId`.

## `GET /cash-transactions`

Lists active cash transactions matching filters.

### Query

| Field | Type | Rules |
| --- | --- | --- |
| `type` | string | Optional `income` or `expense` |
| `fromDate` | date | Optional |
| `toDate` | date | Optional; on or after `fromDate` |
| `categoryId` | UUID | Optional |
| `paidByUserId` | UUID | Optional |
| `sourceType` | string | Optional `manual`, `asset_transaction`, `saving_deposit`, `saving_maturity`, `credit_card_payment`, or `installment_payment` |

## `GET /cash-transactions/balance`

Returns derived household cash balance.

```json
{
  "data": {
    "currency": "VND",
    "incomeAmount": 1000000,
    "expenseAmount": 250000,
    "balance": 750000
  }
}
```

## `GET /cash-transactions/{id}`

Fetches one household-scoped transaction.

## `POST /cash-transactions`

Creates a manual income or expense.

### Body

| Field | Type | Rules |
| --- | --- | --- |
| `type` | string | `income` or `expense` |
| `amount` | number | Positive safe integer |
| `transactionDate` | date | Business date |
| `categoryId` | UUID or null | Optional |
| `paidByUserId` | UUID or null | Optional; defaults to current user if omitted by service flow |
| `note` | string | Optional; 1-1000 trimmed chars |

## `PATCH /cash-transactions/{id}`

Updates a manual transaction. At least one field must be provided.

## `DELETE /cash-transactions/{id}`

Soft-deletes a manual transaction and returns `204 No Content`.
