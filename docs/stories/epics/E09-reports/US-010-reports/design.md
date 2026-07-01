# US-010 Reports Design

## Domain Model

Reports are projections over existing household-scoped records.

- Monthly spending incurred counts spending when the commitment occurs:
  - active manual cash expenses by `transaction_date`;
  - non-cancelled credit-card transactions by `transaction_date`;
  - non-cancelled installment plans by `purchase_date`.
- Cash flow counts real cash movement from active `cash_transactions` by `transaction_date`.
- Upcoming obligations count future pending cash outflow:
  - pending credit-card transactions with `expected_payment_date` in range;
  - pending installment payments with `due_date` in range.
- Asset summary derives current quantity and buy/sell totals from `asset_transactions`.
- Savings summary derives active principal/expected interest and matured actual interest from `saving_deposits`.

## Application Flow

A `ReportsService` resolves the current active household membership from the authenticated user, then executes read-only queries against the existing Drizzle tables. Aggregation is performed in application code for the MVP-scale household dataset, preserving explicit source semantics and avoiding a new persisted report table.

## Interface Contract

All routes require `AccessTokenGuard` and return `{ data: ... }`.

- `GET /reports/monthly-spending?month=YYYY-MM&paidByUserId=<uuid>`
  - returns total spending incurred, source breakdown, and category breakdown.
- `GET /reports/cash-flow?from=YYYY-MM-DD&to=YYYY-MM-DD`
  - returns cash inflow, outflow, net cash flow, and source breakdown.
- `GET /reports/upcoming-obligations?from=YYYY-MM-DD&to=YYYY-MM-DD`
  - returns pending credit-card and installment obligations plus total amount.
- `GET /reports/assets/summary`
  - returns per-asset current quantity, buy/sell totals, and portfolio cost/sell totals.
- `GET /reports/savings/summary?maturityFrom=YYYY-MM-DD&maturityTo=YYYY-MM-DD`
  - returns active principal, expected interest, matured principal/actual interest, and upcoming maturities.

Validation failures return the existing controller-level `validation_error` shape used by prior modules.

## Data Model

No new tables are expected. Reports read existing indexes on household/date/status columns. If later datasets outgrow MVP scale, this story can be followed by SQL aggregation or materialized projections.

## UI / Platform Impact

No UI or platform changes. The endpoints provide backend data for future dashboard views.

## Observability

No new audit records are created because reports are read-only. Operational request logs remain covered by the existing NestJS runtime behavior.

## Alternatives Considered

1. Persist report snapshots.
   - Rejected for MVP because reports must reflect current ledgers and the dataset is small.
2. Treat generated cash-flow settlement rows as spending incurred.
   - Rejected because decisions 0012 through 0016 explicitly separate spending commitments from later cash movement.
3. Add market-value and PnL reports for assets.
   - Rejected because MVP assets intentionally omit live pricing and PnL.
