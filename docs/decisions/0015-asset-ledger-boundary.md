# 0015 Asset Ledger Boundary

Date: 2026-07-02

## Status

Accepted

## Context

`PLAN.md` and `docs/product/personal-finance-mvp.md` define assets as gold, stock, and crypto records with decimal quantities and VND buy/sell cash movements. The repository already has `assets`, `asset_transactions`, and generated cash source support, but US-008 needs the first public API boundary.

The boundary must preserve ledger-derived reporting and cash-balance semantics without introducing mutable portfolio balances or realized PnL calculations in the MVP.

## Decision

Implement US-008 as a separate asset domain with two linked record types:

- `assets` store household-scoped asset definitions and start active.
- `asset_transactions` store immutable buy/sell ledger events.

The public slice supports:

- creating household asset definitions for `gold`, `stock`, and `crypto`;
- listing active assets and reading one active asset with derived current quantity;
- recording buy/sell transactions with positive decimal quantities and positive VND totals;
- listing asset transactions with scoped filters.

Each asset transaction must run transactionally with one generated cash transaction:

1. insert one `asset_transactions` row;
2. create one `cash_transactions` row with `source_type = asset_transaction`;
3. use cash `expense` for buys and cash `income` for sells;
4. link `asset_transactions.cash_transaction_id` to the generated cash row;
5. backfill `cash_transactions.source_id` to the asset transaction id.

Holdings are derived as buy quantity minus sell quantity. Sells that would create a negative derived holding are rejected. The MVP does not calculate realized PnL, unrealized value, or lot accounting.

## Alternatives Considered

1. Store mutable quantity on the `assets` table.
   - Rejected because the product contract says reports and balances are derived from ledgers, not mutable balances.
2. Allow negative holdings for short sales.
   - Rejected because the MVP has no short-selling concept and negative holdings would weaken financial integrity.
3. Add PnL and market valuation in the first asset story.
   - Rejected because the product contract explicitly says MVP assets do not calculate realized PnL.

## Consequences

Positive:

- Asset holdings and cash movements are traceable to immutable ledger rows.
- Cash balance updates immediately for buy/sell events without changing the manual cash transaction contract.
- Future reports can separate asset cash flow from lifestyle spending using `source_type`.

Tradeoffs:

- Asset transaction corrections require a later explicit reversal/editing story.
- Derived quantity uses decimal arithmetic in application code for MVP-scale data.
- No market value or PnL reporting is available until a later reports/valuation story.

## Follow-Up

- Add reports that include asset holdings and asset cash-flow views.
- Decide whether future asset corrections should use reversal entries or controlled edits.
- Add valuation/PnL only when a later story selects those workflows explicitly.
