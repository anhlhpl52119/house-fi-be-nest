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
