# US-010 Reports Overview

## Current Behavior

US-001 through US-009 implement the core household finance ledgers: cash transactions, credit-card spending and settlement, installments, assets, and savings. Cash balance exists, but the backend does not yet expose full derived report endpoints.

## Target Behavior

Authenticated household members can fetch derived reports for:

- monthly spending incurred;
- actual cash flow;
- upcoming obligations;
- asset holdings;
- savings summary.

Reports are read-only, scoped to the current household, and derived from ledger/business tables rather than mutable balances.

## Affected Users

- Owner and member in the private two-person household.

## Affected Product Docs

- `PLAN.md`
- `docs/product/personal-finance-mvp.md`

## Non-Goals

- Budgets, recurring bills, or category budgets.
- Asset market valuation, realized/unrealized PnL, or live price feeds.
- Savings interest auto-calculation.
- Export, chart formatting, or frontend-specific presentation.
- Schema migrations unless implementation discovers a missing persisted field.
