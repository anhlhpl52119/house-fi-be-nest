# Exec Plan

## Goal

Bootstrap the backend foundation for the personal-finance MVP so future domain stories can implement behavior on a runnable NestJS/TypeScript/PostgreSQL/Drizzle/Zod base.

## Scope

In scope:

- Create package/build/test scripts for a NestJS TypeScript backend.
- Add source structure for app, config, database, common utilities, and health.
- Add Zod environment schema and config loader.
- Add Drizzle Postgres configuration and schema definitions for MVP tables.
- Add a health endpoint.
- Run build proof and update Harness evidence.

Out of scope:

- Full auth flows and password hashing.
- Authorization guards and household membership enforcement in controllers.
- Domain CRUD controllers/services beyond health.
- R2 attachments and provider integrations.
- Production deployment configuration.

## Risk Classification

Risk flags:

- Auth, because the foundation includes auth tables and future JWT requirements.
- Authorization, because all business data must be household-scoped.
- Data model, because MVP database tables and constraints are introduced.
- Public contracts, because API conventions and health endpoint are introduced.
- Multi-domain, because the schema spans all MVP finance domains.
- Weak proof, because no prior implementation tests exist.

Hard gates:

- Auth.
- Authorization.
- Data model.

Lane: high-risk.

## Work Phases

1. Discovery: read Harness docs, PLAN.md, durable matrix, skills, and current repo state.
2. Story restoration: create missing high-risk story packet and decision doc.
3. Design: define foundation structure and schema rules.
4. Implementation: scaffold backend foundation and schema.
5. Verification: install dependencies if needed, run build, and run available checks.
6. Harness update: update proof status/evidence and record trace/friction.

## Stop Conditions

Pause for human confirmation if:

- The requested scope expands from backend foundation to full MVP implementation in one pass.
- Product behavior conflicts with `PLAN.md`.
- Database rules require native enum usage.
- Validation requirements must be weakened to claim completion.
