# Overview

## Current Behavior

The backend has auth, member management, and categories, but there is no cash-transactions API. The `cash_transactions` table exists in the foundation schema only as an unused ledger table, so users cannot record daily cash income/expense or inspect cash balance.

## Target Behavior

US-005 establishes household-scoped cash income/expense records for real cash-impacting transactions.

Authenticated household members can create, list, read, update, and soft-delete manual cash transactions. Queries support filtering by type, date range, category, paid-by user, and source type. The API returns a basic cash balance summary derived from active cash transactions.

## Affected Users

- Household owner/member: can record daily cash income and expense for the shared household.
- Future credit-card/installment/asset/savings flows: can link generated cash movements through `source_type` and `source_id` without being implemented in this slice.

## Affected Product Docs

- `docs/product/personal-finance-mvp.md`
- `docs/stories/backlog.md`
- `docs/decisions/0012-cash-ledger-boundary.md`

## Non-Goals

- Credit-card settlement, installment payment, asset buy/sell, or saving deposit workflows.
- Reports beyond a basic derived cash balance endpoint.
- Multiple cash/bank/e-wallet accounts.
- Hard delete of financial records.
- Product audit log implementation.
