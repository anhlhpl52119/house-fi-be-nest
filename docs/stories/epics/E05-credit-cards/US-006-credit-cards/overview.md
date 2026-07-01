# Overview

## Current Behavior

The backend stores `credit_card_transactions` and `credit_card_payments` tables from the foundation schema, but there is no API to record credit-card spending, view pending obligations, or resolve a swipe into a cash payment.

## Target Behavior

US-006 establishes the first credit-card workflow slice for the household finance MVP.

Authenticated household members can:

- create a credit-card expense transaction that records spending incurred without changing cash balance;
- list household credit-card transactions, with `pending` as the default status filter for the main upcoming-obligation view;
- resolve one pending credit-card transaction into one settlement payment;
- list created credit-card payment records.

Resolving a transaction creates a generated cash expense with `source_type = credit_card_payment`, links that cash movement to a `credit_card_payments` row, and marks the original credit-card transaction as `resolved` without counting it as a second spending event.

## Affected Users

- Household owner/member: can record shared household credit-card spending and settle each swipe later.
- Future reports: can distinguish spending incurred from cash outflow by reading credit-card transactions separately from generated cash payments.

## Affected Product Docs

- `docs/product/personal-finance-mvp.md`
- `docs/stories/backlog.md`
- `docs/decisions/0012-cash-ledger-boundary.md`
- `docs/decisions/0013-credit-card-settlement-boundary.md`

## Non-Goals

- Partial settlement of one credit-card transaction across multiple payments.
- Credit-card statement cycles, card accounts, limits, or issuer metadata.
- Full reporting endpoints.
- Installment, asset, savings, or audit-log workflows.
- Editing or cancelling previously created credit-card transactions in this slice.
