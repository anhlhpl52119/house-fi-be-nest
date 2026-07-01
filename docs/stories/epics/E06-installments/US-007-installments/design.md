# Design

## Domain Model

`installment_plans` represent spending incurred at purchase time and do not affect cash balance directly.

Rules:

- `originalAmount`, `installmentCount`, and `monthlyAmount` are positive VND integers.
- `purchaseDate` is the incurred spending date for the original purchase.
- `firstDueDate` is request-only input used to generate scheduled `installment_payments` rows.
- `categoryId` is optional, but if present must be an active accessible `expense` category.
- `paidByUserId` is optional, but if present must be an active member of the current household.
- `createdByUserId` and `householdId` come from the authenticated request.
- new installment plans start in `active` status.
- creating a plan generates exactly `installmentCount` payment rows with sequential `sequenceNo` values.
- generated due dates keep the requested day-of-month when possible and clamp to the last day of shorter months.
- new installment payments start in `pending` status.
- paying one installment creates one generated `cash_transactions` expense row with `source_type = installment_payment`, links it through `cashTransactionId`, and marks that scheduled payment `paid`.
- when the last pending installment payment is paid, the parent plan becomes `completed`.
- generated installment-payment cash transactions are not mutable through the manual cash-transactions API.

## Application Flow

Commands:

- Create installment plan and generated payment schedule.
- Pay one pending installment into a generated cash transaction.

Queries:

- List installment plans for the current household with status/purchase-date/category/paid-by filters; default to `active` when status is omitted.
- Get one installment plan and its payments for the current household.
- List pending upcoming installment payments for the current household with optional plan and due-date filters.

Create plan flow:

1. Resolve the current household membership.
2. Validate optional category and paid-by user inside the current household boundary.
3. Validate `firstDueDate >= purchaseDate`.
4. Insert one `installment_plans` row.
5. Generate `installmentCount` `installment_payments` rows with sequential due dates.

Pay installment flow:

1. Resolve the current household membership.
2. Claim one pending installment payment in the current household inside a DB transaction.
3. Load the parent installment plan for purchase-date validation and completion update.
4. Reject if `amount` does not exactly match the scheduled installment amount.
5. Reject if `paidDate` is before the installment purchase date.
6. Insert generated cash transaction:
   - `type = expense`
   - `amount = installment_payment.amount`
   - `transaction_date = paidDate`
   - `source_type = installment_payment`
   - `source_id` backfilled to the installment payment id
7. Update the installment payment with `status = paid`, `paidDate`, `cashTransactionId`, and `updatedAt`.
8. If no pending payments remain for the plan, update the plan to `completed`.

## Interface Contract

Routes under `/api/v1`:

- `POST /installments/plans`
- `GET /installments/plans`
- `GET /installments/plans/:id`
- `GET /installments/payments/upcoming`
- `POST /installments/payments/:id/pay`

Request bodies and query params use Zod validation. Responses are wrapped in `{ data: ... }`.

Create plan body:

```json
{
  "originalAmount": 12000000,
  "purchaseDate": "2026-07-01",
  "categoryId": "uuid",
  "paidByUserId": "uuid",
  "installmentCount": 6,
  "monthlyAmount": 2000000,
  "firstDueDate": "2026-08-10",
  "note": "Mua laptop trả góp"
}
```

List plan filters:

```text
status? default active
fromDate
toDate
categoryId
paidByUserId
```

Upcoming-payment filters:

```text
installmentPlanId
dueFrom
dueTo
```

Pay installment body:

```json
{
  "paidDate": "2026-08-10",
  "amount": 2000000,
  "note": "Thanh toán kỳ 1"
}
```

Expected errors:

- `400` for invalid input, amount mismatches, or business-date inconsistencies.
- `401` for missing/invalid auth.
- `403` when a member references a category or paid-by user outside the household.
- `404` when the requested plan/payment is outside the current household or missing.
- `409` when attempting to pay a non-pending installment payment.

## Data Model

Use the existing `installment_plans`, `installment_payments`, and `cash_transactions` tables already present in the schema.

No schema migration is expected for the first slice.

## UI / Platform Impact

No frontend implementation in this repo. The API shape supports a future installment-plan detail screen, upcoming-obligations list, and payment action.

## Observability

Harness trace records proof. Product audit logging is still out of scope.

## Alternatives Considered

1. Model installment payments as manual cash transactions only.
   - Rejected because the original installment purchase and later cash payments are different reporting events.
2. Allow arbitrary payment amounts when paying one installment.
   - Rejected because the MVP plan uses fixed scheduled payments and this slice does not support partial or over-pay flows.
3. Implement plan cancellation in the first slice.
   - Rejected to keep the initial installment vertical slice focused on create/list/detail/upcoming/pay behavior.
