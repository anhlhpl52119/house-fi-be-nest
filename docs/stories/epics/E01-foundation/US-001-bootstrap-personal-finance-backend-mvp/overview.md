# US-001 Bootstrap Personal Finance Backend MVP

## Current Behavior

The repository contains Harness documentation and `PLAN.md`, but no runnable backend application. Durable Harness records mark US-001 as in progress, and the decision record exists in the database, but the high-risk story packet was missing from disk.

## Target Behavior

Create an executable backend foundation for the personal-finance MVP:

- NestJS + TypeScript project scaffold.
- Zod-based environment validation.
- Drizzle PostgreSQL configuration and MVP schema definitions.
- Build and validation scripts.
- Health endpoint for a minimal runtime smoke check.

## Affected Users

- Household members who will use the API in later stories.
- Developers/agents implementing follow-up MVP slices.

## Affected Product Docs

- `PLAN.md`
- `docs/product/personal-finance-mvp.md`
- `docs/decisions/0008-personal-finance-backend-foundation.md`

## Non-Goals

- Complete auth/register/login implementation.
- Complete CRUD APIs for every domain.
- Cloudflare R2 attachments.
- Multi-currency.
- Production deployment pipeline.
- Full database integration test environment.
