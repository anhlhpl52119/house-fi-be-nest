# 0014 Installment Ledger Boundary

Date: 2026-07-01

## Status

Accepted

## Context

`PLAN.md` and `docs/product/personal-finance-mvp.md` define installment purchases as spending incurred at purchase time that should not reduce household cash immediately. Later monthly payments reduce cash without becoming new spending. The repository already has `installment_plans`, `installment_payments`, and `cash_transactions` tables, but US-007 needs the first public API boundary for these records.

A product rule is also needed for generating monthly due dates from the first requested due date, especially when later months are shorter.

## Decision

Implement US-007 as a separate installment domain with two linked record types:

- `installment_plans` store the original purchase and start in `active` status.
- `installment_payments` store scheduled monthly obligations and start in `pending` status.

The public slice supports:

- creating an installment plan with generated monthly payments;
- listing installment plans, defaulting to `active` when no status filter is supplied;
- reading one plan together with its generated schedule;
- listing pending upcoming installment payments;
- paying exactly one pending installment at its scheduled amount.

Paying one installment must run transactionally:

1. claim one pending `installment_payments` row in the current household;
2. create one generated `cash_transactions` expense with `source_type = installment_payment`;
3. update the payment row with `status = paid`, `paid_date`, and `cash_transaction_id`;
4. backfill the generated cash transaction `source_id` to the installment payment id;
5. mark the parent plan `completed` when no pending payments remain.

Monthly schedule generation uses the requested `firstDueDate` as sequence 1 and adds calendar months while clamping to the last day of shorter months. This keeps a stable expected day-of-month without skipping months.

For this slice, the pay API accepts `amount` but requires it to exactly equal the scheduled installment amount. Partial payments, over-payments, cancellation, and schedule edits remain future work.

## Alternatives Considered

1. Fold installment payments into manual cash transactions only.
   - Rejected because it would blur the difference between original spending incurred and later cash settlement.
2. Allow arbitrary payment amounts or partial monthly payments.
   - Rejected because the MVP plan chooses fixed scheduled payments and this schema has one cash transaction per payment row.
3. Use native JavaScript month rollover without clamping.
   - Rejected because dates like January 31 would skip into later months instead of staying aligned to the expected monthly cadence.

## Consequences

Positive:

- Spending-incurred and cash-flow semantics stay separated for installment purchases.
- Future reports can count `installment_plans.original_amount` as spending while excluding generated `installment_payment` cash transactions from spending totals.
- Upcoming-obligation queries can read pending payment rows directly.

Tradeoffs:

- No cancellation, rescheduling, or partial-payment flexibility in US-007.
- Generated cash transactions keep payer/category null, so categorization remains on the original installment plan only.
- Month-clamping behavior becomes part of the API contract for edge dates.

## Follow-Up

- Add reports that combine installment spending and cash-flow views without double-counting.
- Decide whether future payment flows need explicit payer/account attribution.
- Add cancellation or rescheduling only when a later story selects those workflows explicitly.
