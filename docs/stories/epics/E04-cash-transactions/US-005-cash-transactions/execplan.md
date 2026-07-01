# Exec Plan

## Goal

Implement US-005 cash transactions with household-scoped CRUD, filters, soft deletion, and a derived cash balance endpoint.

## Scope

In scope:

- Cash transaction schema/migration updates for soft delete and future source types.
- Cash transactions NestJS module with controller, service, response types, and Zod request/query schemas.
- Household authorization checks for transaction, category, and paid-by member references.
- Unit tests for cash transaction Zod schemas.
- Product docs, backlog, decision, durable story/matrix updates.

Out of scope:

- Credit card, installment, asset, and saving workflows.
- Full reporting module.
- Product audit log.
- Multiple cash accounts.
- Frontend UI.

## Risk Classification

Risk flags:

- Auth.
- Authorization.
- Data model.
- Public contracts.
- Existing behavior.
- Weak proof.

Hard gates:

- Auth/authorization on household-scoped financial records.
- Data model change to a financial ledger table.

## Work Phases

1. Discovery of existing auth, category, schema, migration, and test patterns.
2. Create high-risk story packet and decision record.
3. Update schema and migration for cash transaction behavior.
4. Implement cash transaction module, validation, and service rules.
5. Run lint/build/tests and available DB/API proof.
6. Update Harness records and trace.

## Stop Conditions

Pause for human confirmation if:

- Cash ledger semantics would conflict with `PLAN.md` reporting rules.
- Migration would require destructive data loss.
- Validation or household scoping requirements need to be weakened.
- US-005 is intended to mean a different product slice than cash transactions.
