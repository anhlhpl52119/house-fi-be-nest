# Story Backlog

This backlog tracks candidate epics from the accepted personal-finance MVP
contract. Do not create every possible story packet up front. Create story
packets only when work is selected or when a product decision needs a durable
place to land.

Sources:

- `PLAN.md`
- `docs/product/personal-finance-mvp.md`
- `docs/decisions/0008-personal-finance-backend-foundation.md`

## Candidate Epics

| Epic | Description | Status |
| --- | --- | --- |
| E01 Auth and Users | Email/password auth, JWT access tokens, refresh token persistence, user records, and request identity. | US-002 and US-003 implemented |
| E02 Households | Household records, household membership, and household-scoped access foundations for business records. | member-management slice implemented by US-003; broader household CRUD/current APIs unsliced |
| E03 Categories | Income/expense categories with maximum depth of two levels and validation for category hierarchy rules. | US-004 implemented |
| E04 Cash Transactions | Cash income/expense APIs and ledger semantics for real cash-impacting daily transactions. | US-005 implemented |
| E05 Credit Cards | Credit-card spending, pending transactions, and per-transaction settlement payments without double-counting expense. | unsliced |
| E06 Installments | Installment plans, scheduled payments, actual payments, and reporting semantics for original spend versus cash flow. | unsliced |
| E07 Assets | Asset definitions and buy/sell ledgers for gold, stock, and crypto using decimal quantities and VND cash movements. | unsliced |
| E08 Savings | Saving deposits, maturity workflow, expected/actual interest, and linked cash-flow records. | unsliced |
| E09 Reports | Derived reports for spending incurred, cash flow, obligations, assets, and savings. | unsliced |

## Suggested Next Slice

US-005 starts `E04 Cash Transactions` with household-scoped manual cash income/expense records and a basic balance endpoint. After US-005, the next slice should start `E05 Credit Cards`, because credit-card settlement can reuse the cash ledger through generated `credit_card_payment` cash transactions.
