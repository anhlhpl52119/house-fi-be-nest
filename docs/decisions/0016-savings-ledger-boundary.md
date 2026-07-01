# 0016 Savings Ledger Boundary

Date: 2026-07-02

## Status

Accepted

## Context

`PLAN.md` and `docs/product/personal-finance-mvp.md` define saving deposits as cash outflows that are not lifestyle spending, with maturity returning principal plus interest as cash income. The repository already has `saving_deposits` and generated cash source support, but US-009 needs the first public API boundary.

The boundary must preserve derived reporting and cash-balance semantics without adding mutable savings balances or automatic bank-interest calculations in the MVP.

## Decision

Implement US-009 as a separate savings domain centered on `saving_deposits`.

The public slice supports:

- creating household-scoped saving deposits with explicit principal, interest rate, start date, planned maturity date, optional term months, optional expected interest, optional paid-by member, and note;
- listing and fetching household saving deposits;
- maturing one active saving deposit with explicit actual interest.

Each saving deposit creation must run transactionally with one generated cash transaction:

1. create one `cash_transactions` expense with `source_type = saving_deposit` for the principal outflow;
2. insert one `saving_deposits` row with `status = active` and `deposit_cash_transaction_id` linked to that cash row;
3. backfill `cash_transactions.source_id` to the saving deposit id.

Each maturity must run transactionally:

1. claim one active `saving_deposits` row in the current household;
2. require the actual maturity date to be on or after the planned maturity date;
3. create one `cash_transactions` income with `source_type = saving_maturity` for `principal + actualInterestAmount`;
4. set `status = matured`, store `actual_interest_amount`, and link `maturity_cash_transaction_id`;
5. backfill `cash_transactions.source_id` to the saving deposit id.

Early withdrawal, cancellation, rollover, partial maturity, and automatic interest calculation remain future work.

## Alternatives Considered

1. Treat deposits as manual cash expenses and maturity as manual income only.
   - Rejected because future reports need to distinguish savings cash flow from lifestyle spending and ordinary income.
2. Store a mutable savings balance per household.
   - Rejected because the product contract says reports and balances are derived from ledger/business records, not mutable balances.
3. Calculate actual interest automatically from rate and dates.
   - Rejected because banking products vary and the MVP schema already supports explicit expected and actual interest values.

## Consequences

Positive:

- Saving deposits and maturity cash movements remain traceable through linked ledger rows.
- Cash balance reflects principal outflow and principal-plus-interest inflow without changing manual cash transaction behavior.
- Future reports can separate savings cash flow from spending and income using `source_type`.

Tradeoffs:

- The first savings slice supports one-shot maturity only.
- Corrections, early withdrawals, and rollovers require later explicit stories.
- Interest calculation is caller-provided rather than computed by the backend.

## Follow-Up

- Add reports that include savings principal outflows, expected/actual interest, and matured deposits.
- Decide whether early withdrawal should use `withdrawn` status and a generated cash flow in a later story.
- Add rollover behavior only when selected explicitly.
