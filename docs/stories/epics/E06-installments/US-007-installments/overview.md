# Overview

## Current Behavior

The repository already has `installment_plans` and `installment_payments` tables from the foundation schema, but there is no API to create installment purchases, inspect generated schedules, view upcoming pending payments, or settle one scheduled installment into a cash outflow.

## Target Behavior

US-007 establishes the first installment workflow slice for the household finance MVP.

Authenticated household members can:

- create a household-scoped installment plan that records the original spending amount without changing cash balance immediately;
- automatically generate the monthly installment payment schedule when the plan is created;
- list household installment plans, defaulting to `active` when no status filter is provided;
- fetch one installment plan together with its generated payments;
- list upcoming pending installment payments ordered by due date;
- pay one pending installment, which creates one generated `installment_payment` cash expense and marks the scheduled payment as paid.

Paying the final pending installment marks the parent plan as `completed`. The original installment plan remains the spending-incurred record, while generated installment-payment cash transactions represent real cash outflow only.

## Affected Users

- Household owner/member: can record installment purchases and pay each scheduled month from shared household cash.
- Future reports: can count original installment purchases as spending while excluding generated installment-payment cash transactions from spending totals.

## Affected Product Docs

- `docs/product/personal-finance-mvp.md`
- `docs/stories/backlog.md`
- `docs/decisions/0012-cash-ledger-boundary.md`
- `docs/decisions/0014-installment-ledger-boundary.md`

## Non-Goals

- Cancelling installment plans or individual installment payments.
- Partial installment payments or editing scheduled payment amounts.
- Interest/fee decomposition beyond storing the chosen monthly payment amount.
- Full reporting endpoints or dashboard aggregation.
- Frontend UI.
