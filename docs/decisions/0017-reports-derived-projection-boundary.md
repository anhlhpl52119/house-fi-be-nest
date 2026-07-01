# 0017 Reports Derived Projection Boundary

Date: 2026-07-02

## Status

Accepted

## Context

US-010 starts the reports epic after cash, credit-card, installment, asset, and savings workflows all create their domain records and linked cash movements. Reports must preserve the accepted ledger decisions: spending incurred and cash flow are different views, and generated settlement/payment/savings/asset cash rows must not be blindly counted as lifestyle spending.

## Decision

Implement reports as read-only derived projections over existing household-scoped tables.

The first reports slice exposes:

- monthly spending incurred from active manual cash expenses, non-cancelled credit-card transactions, and non-cancelled installment plans;
- cash flow from active cash transactions;
- upcoming obligations from pending credit-card transactions and pending installment payments;
- asset summary from asset definitions and buy/sell asset transactions;
- savings summary from saving deposits.

No report snapshot or mutable aggregate table is introduced in US-010. Application code may aggregate MVP-scale household datasets in memory while preserving explicit source semantics. Every report resolves the current active household membership from the authenticated user and filters by `household_id`.

## Alternatives Considered

1. Persist monthly report snapshots.
   - Rejected because the MVP needs current ledger-derived truth and has no closing-period workflow.
2. Sum all cash expenses for spending incurred.
   - Rejected because generated credit-card payments, installment payments, saving deposits, and asset buys would double-count or misclassify spending.
3. Add asset market value and PnL to the report slice.
   - Rejected because asset pricing and PnL are explicit non-goals for the MVP asset boundary.

## Consequences

Positive:

- Reports stay consistent with existing ledger decisions.
- No schema migration is required for the first report slice.
- Future dashboard endpoints can evolve from a clear read-only boundary.

Tradeoffs:

- Large historical datasets may eventually need SQL aggregation or materialized projections.
- Asset reports show quantities and recorded cash totals, not current market value.
- Spending category attribution remains limited by the originating records available in the MVP.

## Follow-Up

- Add budget/report modes only when a later story selects them explicitly.
- Revisit aggregation strategy if query volume or household data size grows beyond MVP assumptions.
