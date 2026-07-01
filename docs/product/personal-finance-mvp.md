# Personal Finance Backend MVP Product Contract

Date: 2026-07-01
Source input: `PLAN.md`

## Product Goal

Build a private personal-finance backend for a two-person household. The backend records daily cash flow, credit-card spending and settlement, installments, asset transactions, savings deposits, and derived reports.

## Users and Scope

- MVP users are two household members: wife and husband.
- Both members can see each other's records.
- APIs must support filtering by the user who paid/performed a transaction.
- User-created records must keep `created_by_user_id`.
- Business records must be scoped by `household_id`.

## Stack Decisions

- NestJS + TypeScript.
- PostgreSQL/Supabase.
- Drizzle ORM with migrations.
- Zod for runtime validation at boundaries.
- JWT access token and refresh token persistence.
- Cloudflare R2 attachments are out of scope for MVP.

## Financial Data Rules

- Currency is VND only.
- Money is stored as positive integer/bigint VND amounts.
- Do not use float/double for money.
- Asset quantities use decimal/numeric values, not floating point.
- Reports are derived from ledger/business records, not mutable balances.

## Database Rules

- Use UUID primary keys for business tables.
- Every business table includes `household_id` unless it is global auth/user infrastructure.
- Do not use PostgreSQL native enum or Drizzle enum.
- Use varchar/string columns plus database `CHECK` constraints.
- Use TypeScript union types and Zod enums at the application boundary.
- Use `timestamptz` for timestamps and `date` for business dates.

## Core Domains

- Auth and users.
- Households and household members.
- Categories, with maximum depth of two levels.
- Cash transactions for real cash-impacting income/expense.
- Credit-card transactions and individual settlement payments.
- Installment plans and installment payments.
- Assets and asset buy/sell ledgers.
- Saving deposits and maturity.
- Reports for spending incurred, cash flow, obligations, assets, and savings.

## Reporting Semantics

- Cash balance is income cash transactions minus expense cash transactions.
- Credit-card spending counts as spending incurred when swiped, but affects cash only when resolved by payment.
- Installment original amount counts as spending incurred; monthly payments are cash flow and must not be double-counted as spending.
- Saving deposit is cash outflow but not lifestyle spending; maturity income includes principal plus interest.
- Asset buy/sell changes cash and holdings; MVP does not calculate realized PnL.

## Initial Implementation Slice

US-001 establishes the backend foundation needed for later feature stories:

- runnable NestJS TypeScript project;
- Zod env validation;
- Drizzle Postgres configuration and schema definitions for MVP tables;
- validation/build scripts;
- health endpoint for platform smoke proof.

US-001 does not complete every domain API. Later stories implement CRUD and workflows per domain.

US-002 establishes the first auth and identity API slice:

- email/password registration and login;
- JWT access tokens;
- persisted, hashed, rotating refresh tokens;
- logout and current-user APIs;
- default household and owner membership creation during registration.

US-002 does not implement invite/member management, password reset, email verification, MFA, rate limiting, category seeding, or financial domain APIs.

US-003 establishes the member-management slice for the private two-person MVP:

- authenticated household owners can create the second member account with email, display name, and an initial password;
- the new member is added to the owner's household with role `member` and can login through the existing auth API;
- active household members can list active members in their household;
- member creation is owner-only and the MVP household is limited to two active members.

US-003 does not implement email invite tokens, existing-user attachment, household switching, member removal, password reset, email verification, MFA, rate limiting, category seeding, or financial domain APIs.

US-004 establishes the category slice for later financial records:

- system categories are global Vietnamese income/expense defaults with two-level hierarchy, icons, UI colors, and AI-readable descriptions;
- custom categories are owned by the current household so both household members share category definitions;
- authenticated members can list active system plus household categories, filter by type, and create/update/soft-delete household custom categories;
- category validation enforces income/expense type, same-type parent relationships, and a maximum depth of two levels.

US-004 does not implement AI natural-language transaction creation, transaction CRUD, report category usage, or admin management of system categories.

US-005 establishes the cash transaction slice for real cash-impacting household ledger entries:

- authenticated members can create, list, read, update, and soft-delete manual cash income/expense transactions;
- all records are scoped to the authenticated user's current household and keep `created_by_user_id`;
- transaction filters support type, date range, category, paid-by user, and source type;
- category and paid-by references are validated against the current household boundary;
- a basic cash balance endpoint derives income minus expense from active cash transactions.

US-005 does not implement credit-card settlement, installment payment, asset buy/sell, saving deposit workflows, full reports, product audit logs, multiple cash accounts, or destructive ledger deletes.

US-006 establishes the credit-card spending and settlement slice:

- authenticated members can create household-scoped credit-card expense transactions that count as spending incurred but not immediate cash movement;
- transaction listing defaults to `pending` credit-card obligations and also supports resolved/cancelled status filtering;
- resolving one pending credit-card transaction creates one linked credit-card payment record and one generated `credit_card_payment` cash expense;
- generated settlement cash flow affects cash balance only at payment time, while the original credit-card transaction remains the spending record.

US-006 does not implement partial settlements, card account metadata, statement-cycle management, transaction editing/cancellation, full reports, or product audit logs.

US-007 establishes the installment planning and payment slice:

- authenticated members can create household-scoped installment plans that record original spending without immediate cash movement;
- creating a plan generates scheduled monthly installment payments;
- authenticated members can list active installment plans, read one plan with its schedule, and view pending upcoming installment payments;
- paying one pending installment creates one linked generated `installment_payment` cash expense;
- paying the final pending installment marks the plan `completed` while keeping the original installment plan as the spending record.

US-007 does not implement plan/payment cancellation, partial payments, interest decomposition, full reports, or product audit logs.
