# Overview

## Current Behavior

The repository already has a `saving_deposits` table and the cash ledger already reserves `source_type = saving_deposit` and `saving_maturity`, but there is no public API to create household saving deposits, mature them, or view saving deposit history.

## Target Behavior

US-009 establishes the first savings workflow slice for the household finance MVP.

Authenticated household members can:

- create household-scoped saving deposits with bank name, principal amount, interest rate, planned start/maturity dates, optional term months, optional expected interest, optional paid-by member, and note;
- create one linked generated cash expense for each saving deposit principal outflow;
- list saving deposits with status, start-date, maturity-date, and paid-by filters;
- fetch one saving deposit in the current household;
- mark an active saving deposit as matured with actual interest, creating one linked generated cash income for principal plus actual interest.

Savings are not lifestyle spending. Cash balance changes when principal leaves cash at deposit creation and when principal plus actual interest returns at maturity.

## Affected Users

- Household owner/member: can track bank saving deposits and their cash impact.
- Future reports: can include saving principal outflows and maturity inflows without treating deposits as lifestyle spending.

## Affected Product Docs

- `docs/product/personal-finance-mvp.md`
- `docs/stories/backlog.md`
- `docs/decisions/0012-cash-ledger-boundary.md`
- `docs/decisions/0016-savings-ledger-boundary.md`

## Non-Goals

- Early withdrawal, cancellation, rollover, or partial maturity.
- Multiple cash/bank accounts.
- Accrual schedules, compounding calculations, or automatic interest calculation.
- Editing/deleting saving deposits after creation.
- Frontend UI.
