# 0013 Credit Card Settlement Boundary

Date: 2026-07-01

## Status

Accepted

## Context

`PLAN.md` and `docs/product/personal-finance-mvp.md` define credit-card spending as incurred expense that does not immediately reduce household cash. Later settlement must reduce cash without creating a second spending event. The repository already has `credit_card_transactions`, `credit_card_payments`, and `cash_transactions` tables, but US-006 needs the first public API boundary for these records.

## Decision

Implement US-006 as a separate credit-card domain with two linked record types:

- `credit_card_transactions` store swipe-time spending and start in `pending` status.
- `credit_card_payments` store one settlement payment per transaction.

The public slice supports:

- creating a credit-card transaction;
- listing credit-card transactions, defaulting to `pending` when no status filter is supplied;
- resolving exactly one pending transaction at full amount;
- listing credit-card payments.

Resolving a transaction must run transactionally:

1. create one generated `cash_transactions` expense with `source_type = credit_card_payment`;
2. create one `credit_card_payments` row;
3. backfill the generated cash transaction `source_id` to the payment id;
4. update the original credit-card transaction to `resolved` with `resolved_payment_id` and `resolved_at`.

For this slice, generated cash-payment records keep `category_id` and `paid_by_user_id` null. Spending categorization remains on the original credit-card transaction, which avoids implying that settlement itself is a categorized expense.

## Alternatives Considered

1. Fold credit-card spending into manual cash transactions.
   - Rejected because it would reduce cash too early and blur the difference between incurred spending and later settlement.
2. Allow partial payments or multiple payments per transaction.
   - Rejected because the MVP plan chooses individual full resolution and the schema already enforces one payment per transaction.
3. Copy the original category and payer onto generated cash payments.
   - Rejected for now because settlement is cash-flow proof, not new categorized spending, and the payment schema has no dedicated payer/category fields.

## Consequences

Positive:

- Spending-incurred and cash-flow semantics stay separated.
- Future reports can count credit-card transactions as spending while excluding generated settlement cash transactions from spending totals.
- The manual cash-transactions API remains reserved for user-entered cash movements.

Tradeoffs:

- No partial-settlement flexibility in US-006.
- Generated cash payments carry less attribution detail than the originating swipe.
- Statement-cycle/card-account features remain future work.

## Follow-Up

- Add reports that combine cash expenses and credit-card spending without double-counting settlements.
- Decide whether future payment flows need explicit payer/account attribution.
- Extend the same separation pattern to installments, savings, and asset cash movements.
