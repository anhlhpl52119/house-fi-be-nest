# Installments API

Installments record the original purchase as spending incurred and generate a payment schedule for future cash outflows. Routes require bearer auth.

## Rules

- Creating a plan records original spending but does not immediately affect cash balance.
- The API generates monthly scheduled payment rows.
- Paying a pending installment creates a generated `installment_payment` cash expense.
- The final paid installment marks the plan `completed`.

## `GET /installments/plans`

Lists installment plans.

### Query

| Field | Type | Rules |
| --- | --- | --- |
| `status` | string | Optional `active`, `completed`, or `cancelled` |
| `fromDate` / `toDate` | date | Optional purchase-date range |
| `categoryId` | UUID | Optional |
| `paidByUserId` | UUID | Optional |

## `POST /installments/plans`

Creates a plan and payment schedule.

### Body

| Field | Type | Rules |
| --- | --- | --- |
| `originalAmount` | number | Positive safe integer VND |
| `purchaseDate` | date | Original purchase date |
| `categoryId` | UUID or null | Optional |
| `paidByUserId` | UUID or null | Optional |
| `installmentCount` | number | Positive integer |
| `monthlyAmount` | number | Positive safe integer VND |
| `firstDueDate` | date | On or after `purchaseDate` |
| `note` | string | Optional |

## `GET /installments/plans/{id}`

Returns a plan with its generated `payments` array.

## `GET /installments/payments/upcoming`

Lists upcoming pending installment payments.

### Query

| Field | Type | Rules |
| --- | --- | --- |
| `installmentPlanId` | UUID | Optional |
| `dueFrom` / `dueTo` | date | Optional due-date range |

## `POST /installments/payments/{id}/pay`

Pays one pending installment.

### Body

| Field | Type | Rules |
| --- | --- | --- |
| `paidDate` | date | Actual payment date |
| `amount` | number | Positive safe integer VND |
| `note` | string | Optional |
