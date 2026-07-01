# Design

## Domain Model

`SavingDeposit` represents one household bank saving deposit.

Business rules:

- Deposits belong to one household and preserve `created_by_user_id`.
- Principal and interest amounts are positive/non-negative VND integers and must stay within JavaScript safe integer range at the API boundary.
- `interestRate` is a non-negative decimal string with up to four fractional digits, stored in PostgreSQL `numeric(8,4)`.
- Creating a deposit starts it in `active` status.
- Deposit creation creates a generated cash `expense` for the principal with `source_type = saving_deposit`.
- Maturity is allowed only once and only for `active` deposits.
- Maturity creates a generated cash `income` for `principalAmount + actualInterestAmount` with `source_type = saving_maturity`, sets `status = matured`, and stores `actualInterestAmount`.
- Early withdrawal, cancellation, rollover, and partial maturity are separate future stories.

## Application Flow

Create deposit:

1. Resolve the requester's active household membership.
2. Validate optional paid-by user belongs to that household.
3. Create a generated `cash_transactions` expense with `source_type = saving_deposit` and `source_id = null`.
4. Insert the `saving_deposits` row linked to the deposit cash transaction.
5. Backfill the cash transaction `source_id` to the saving deposit id.
6. Return the saving deposit response.

Mature deposit:

1. Resolve the requester's active household membership.
2. Atomically claim the active saving deposit row in the current household by setting `status = matured` and `actual_interest_amount`.
3. Reject missing rows with `404` and non-active rows with `409`.
4. Require maturity date on or after the planned maturity date.
5. Create a generated `cash_transactions` income for principal plus actual interest with `source_type = saving_maturity`.
6. Link `saving_deposits.maturity_cash_transaction_id` and backfill cash `source_id`.
7. Return the updated saving deposit response.

## Interface Contract

Base route: `/savings/deposits` behind `AccessTokenGuard`.

- `GET /savings/deposits`
  - Query: `status`, `startFrom`, `startTo`, `maturityFrom`, `maturityTo`, `paidByUserId`.
  - Defaults to `status=active` when omitted.
  - Returns `{ data: SavingDepositResponse[] }`.
- `POST /savings/deposits`
  - Body: `bankName`, `principalAmount`, `interestRate`, `startDate`, `maturityDate`, optional `termMonths`, optional `expectedInterestAmount`, optional nullable `paidByUserId`, optional `note`.
  - Returns `{ data: SavingDepositResponse }`.
- `GET /savings/deposits/:id`
  - Returns one household-scoped deposit.
- `POST /savings/deposits/:id/mature`
  - Body: `maturityDate`, `actualInterestAmount`, optional `note`.
  - Returns the matured deposit.

Errors use the existing NestJS exception pattern and controller-level Zod validation envelope.

## Data Model

Uses existing tables:

- `saving_deposits`
  - `deposit_cash_transaction_id` is required and unique.
  - `maturity_cash_transaction_id` is nullable and unique.
  - `status` uses varchar + CHECK constraint.
- `cash_transactions`
  - generated savings rows use `source_type = saving_deposit` or `saving_maturity`.
  - generated rows backfill `source_id` to the saving deposit id.

No schema migration is expected for US-009 because the foundation schema already includes savings columns and cash source types.

## UI / Platform Impact

No frontend UI or platform-shell change. `/health` must remain available.

## Observability

Product audit logs remain out of scope. Harness trace records files changed and validation evidence. Generated cash transactions preserve traceability through source type/id links.

## Alternatives Considered

1. Store a mutable savings balance on the household.
   - Rejected because product rules require reports and balances to be derived from ledger/business records.
2. Calculate interest automatically from rate and dates.
   - Rejected for this slice because banking products vary and the existing schema supports expected/actual interest as explicit VND amounts.
3. Model maturity as a separate table.
   - Rejected because the current MVP schema links one maturity cash transaction from `saving_deposits`, which is enough for one-shot maturity.
