# Credit Cards API

Credit-card transactions record spending incurred before cash is paid. Routes require bearer auth.

## Rules

- A swipe creates a `pending` credit-card transaction and does not affect cash balance.
- Resolving a pending transaction creates one payment record and one generated `credit_card_payment` cash expense.
- The generated payment affects cash flow but must not be counted again as spending incurred.
- Partial settlements and card-account metadata are out of scope.

## `GET /credit-cards/transactions`

Lists credit-card transactions. If no status is selected by the caller, UI clients commonly use this endpoint for pending obligations.

### Query

| Field | Type | Rules |
| --- | --- | --- |
| `status` | string | Optional `pending`, `resolved`, or `cancelled` |
| `fromDate` / `toDate` | date | Optional transaction-date range |
| `categoryId` | UUID | Optional |
| `paidByUserId` | UUID | Optional |
| `expectedPaymentFrom` / `expectedPaymentTo` | date | Optional expected-payment range |

## `POST /credit-cards/transactions`

Creates a credit-card spending record.

### Body

| Field | Type | Rules |
| --- | --- | --- |
| `amount` | number | Positive safe integer VND |
| `transactionDate` | date | Swipe date |
| `categoryId` | UUID or null | Optional expense category |
| `paidByUserId` | UUID or null | Optional |
| `expectedPaymentDate` | date or null | Optional; on or after `transactionDate` |
| `note` | string | Optional; 1-1000 chars |

## `POST /credit-cards/transactions/{id}/resolve`

Settles one pending credit-card transaction.

### Body

| Field | Type | Rules |
| --- | --- | --- |
| `paymentDate` | date | Actual cash payment date |
| `note` | string | Optional |

### Response

`201 Created` with the payment record, including `cashTransactionId`.

## `GET /credit-cards/payments`

Lists settlement payments.

### Query

| Field | Type | Rules |
| --- | --- | --- |
| `creditCardTransactionId` | UUID | Optional |
| `fromDate` / `toDate` | date | Optional payment-date range |
