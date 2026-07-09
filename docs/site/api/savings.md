# Savings API

Savings routes manage bank saving deposits and their cash impact. Routes require bearer auth.

## Rules

- Creating a deposit creates a generated `saving_deposit` cash expense for principal outflow.
- Maturing a deposit creates a generated `saving_maturity` cash income for principal plus actual interest.
- Deposit cash flows affect cash balance but are not lifestyle spending.
- Early withdrawal, rollover, and partial maturity are out of scope.

## `GET /savings/deposits`

Lists saving deposits.

### Query

| Field | Type | Rules |
| --- | --- | --- |
| `status` | string | Optional `active`, `matured`, `withdrawn`, or `cancelled` |
| `startFrom` / `startTo` | date | Optional start-date range |
| `maturityFrom` / `maturityTo` | date | Optional maturity-date range |
| `paidByUserId` | UUID | Optional |

## `POST /savings/deposits`

Creates a saving deposit and generated cash expense.

### Body

| Field | Type | Rules |
| --- | --- | --- |
| `bankName` | string | 1-160 chars |
| `principalAmount` | number | Positive safe integer VND |
| `interestRate` | string | Decimal string with up to 4 fractional digits |
| `startDate` | date | Deposit start date |
| `maturityDate` | date | On or after `startDate` |
| `termMonths` | number | Optional positive integer |
| `expectedInterestAmount` | number | Optional non-negative safe integer VND |
| `paidByUserId` | UUID or null | Optional |
| `note` | string | Optional |

## `GET /savings/deposits/{id}`

Fetches one saving deposit.

## `POST /savings/deposits/{id}/mature`

Matures one active saving deposit.

### Body

| Field | Type | Rules |
| --- | --- | --- |
| `maturityDate` | date | Actual maturity date |
| `actualInterestAmount` | number | Non-negative safe integer VND |
| `note` | string | Optional |
