# 0008 Personal Finance Backend Foundation

Date: 2026-07-01

## Status

Accepted

## Context

`PLAN.md` defines a private personal-finance backend for a two-person household. The MVP touches auth, authorization, database schema, financial ledgers, API contracts, and reporting semantics, so implementation must start from an explicit foundation rather than ad-hoc files.

The existing durable Harness records already contain decision `0008-personal-finance-backend-foundation`, but the markdown decision file was missing. This file restores the source-of-truth decision document.

## Decision

Bootstrap the backend as a NestJS + TypeScript service using PostgreSQL, Drizzle ORM, and Zod.

Foundation rules:

- Use Zod for env and request-boundary validation.
- Use Drizzle for PostgreSQL schema and migration generation.
- Use UUID primary keys for business records.
- Store VND amounts as integer/bigint values.
- Store asset quantities as PostgreSQL numeric decimals.
- Avoid PostgreSQL native enums and Drizzle enums; use varchar columns, database `CHECK` constraints, TypeScript unions, and Zod enums.
- Scope business data by `household_id` and preserve `created_by_user_id` on user-created records.
- Add a health endpoint as the first runtime smoke check.

## Alternatives Considered

1. Implement the entire MVP in one story.
   - Rejected because the blast radius spans many domains and would be difficult to validate safely.
2. Start with only docs and postpone code scaffolding.
   - Rejected because US-001 needs an executable foundation and build proof.
3. Use native PostgreSQL enums.
   - Rejected per product plan because CHECK constraints are easier to evolve.

## Consequences

Positive:

- Later domain stories can build on stable project, validation, and database foundations.
- Schema rules match financial data integrity requirements from the start.
- Build proof can be recorded before business workflows are added.

Tradeoffs:

- US-001 is intentionally a foundation slice, not the full MVP feature set.
- Domain APIs still require follow-up stories.
- Database integration proof depends on an available Postgres environment.

## Follow-Up

- Add domain API stories for auth, categories, cash transactions, credit cards, installments, assets, savings, and reports.
- Add integration tests once database test infrastructure exists.
