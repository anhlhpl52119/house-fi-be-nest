# 0012 Cash Ledger Boundary

Date: 2026-07-01

## Status

Accepted

## Context

`PLAN.md` defines cash transactions as the real cash-impacting ledger for the household. Credit-card spending, installments, asset transactions, and savings have separate business tables and may create linked cash movements later. US-005 starts the cash ledger API before those workflows exist.

The boundary must avoid double-counting future spending reports while still allowing a basic cash balance to be derived from cash movements.

## Decision

Implement cash transactions as household-scoped, positive-amount ledger records where direction is determined by `type`:

- `income` increases cash balance.
- `expense` decreases cash balance.
- user-created entries are `source_type = manual`.
- later generated flows may use source types for credit-card payments, installment payments, asset transactions, saving deposits, and saving maturities.
- financial deletes are soft deletes through `is_active = false`.
- category and paid-by references must belong to the current household boundary, while system categories are allowed when their type matches the transaction type.

US-005 exposes CRUD and a derived cash balance endpoint only. Full spending/cash-flow reports remain a later reports story.

## Alternatives Considered

1. Treat every cash expense as spending report data immediately.
   - Rejected because future credit-card and installment payments would be double-counted unless report logic distinguishes source types.
2. Require multiple cash accounts before recording transactions.
   - Rejected because the MVP explicitly uses one household cash concept.
3. Hard-delete cash transactions.
   - Rejected because financial ledgers should avoid destructive deletes in the MVP.

## Consequences

Positive:

- Daily income/expense entry can ship before more complex financial domains.
- Future workflows can link generated cash movements without changing the public cash transaction contract.
- Balance is derived from ledger records instead of mutable state.

Tradeoffs:

- The balance endpoint is not a complete report module.
- Soft-deleted records remain in the database and must be excluded by active queries.
- Full report semantics are deferred until credit cards, installments, assets, and savings exist.

## Follow-Up

- Add credit-card settlement flow that creates `credit_card_payment` cash expenses.
- Add installment payment flow that creates `installment_payment` cash expenses.
- Add asset and savings workflows with linked cash movements.
- Add reports that separate spending incurred from cash flow.
