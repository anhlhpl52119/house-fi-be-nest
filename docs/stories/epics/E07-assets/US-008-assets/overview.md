# Overview

## Current Behavior

The repository already has `assets` and `asset_transactions` tables from the foundation schema, and the cash ledger already reserves `source_type = asset_transaction`, but there is no API to create household asset definitions, record buy/sell trades, view asset transaction history, or derive current holdings.

## Target Behavior

US-008 establishes the first asset workflow slice for the household finance MVP.

Authenticated household members can:

- create household-scoped asset definitions for gold, stock, or crypto;
- list active household assets and fetch one asset with its derived current quantity;
- record buy and sell asset transactions with positive decimal quantities and positive VND totals;
- create one linked generated cash transaction for each asset transaction, where buys are cash expenses and sells are cash income;
- list household asset transactions with asset/type/date/paid-by filters.

Asset holdings are derived from the transaction ledger as buys minus sells. The MVP does not calculate realized PnL.

## Affected Users

- Household owner/member: can track gold, stock, and crypto positions and the cash impact of buy/sell events.
- Future reports: can include asset cash movements without treating asset buys as lifestyle spending.

## Affected Product Docs

- `docs/product/personal-finance-mvp.md`
- `docs/stories/backlog.md`
- `docs/decisions/0012-cash-ledger-boundary.md`
- `docs/decisions/0015-asset-ledger-boundary.md`

## Non-Goals

- Realized/unrealized PnL calculations.
- Market-price feeds or external broker/exchange integration.
- Asset transfers, splits, dividends, staking, or fees.
- Editing or deleting asset transactions after creation.
- Frontend UI.
