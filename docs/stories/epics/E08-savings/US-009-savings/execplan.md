# Exec Plan

## Goal

Implement a bounded savings deposit and maturity API slice with generated cash ledger linkage.

## Scope

In scope:

- High-risk story packet and durable story record for US-009.
- Savings API schemas, response types, controller, service, and module wiring.
- Creating active saving deposits with a generated `saving_deposit` cash expense.
- Maturing active deposits with a generated `saving_maturity` cash income for principal plus actual interest.
- Listing/fetching household-scoped saving deposits.
- Unit tests for savings Zod boundary validation.
- Validation with lint, build, tests, and optional isolated Postgres smoke proof when available.

Out of scope:

- Early withdrawal, cancellation, rollover, partial maturity, or edits/deletes.
- Automatic interest calculation or bank-provider integrations.
- Full reports beyond generated cash-flow records.
- Product audit logs.

## Risk Classification

Risk flags:

- Authorization: all records must be scoped to the authenticated user's current household.
- Data model: the existing `saving_deposits` table and generated cash links become public behavior.
- Public contracts: new API routes, request bodies, filters, and responses.
- Existing behavior: cash balance and generated cash transaction semantics are extended.
- Weak proof: no service-level integration tests are in the repository yet.

Hard gates:

- Authorization.
- Data model / financial ledger integrity.

Lane: high-risk.

## Work Phases

1. Discovery: read Harness context, product contract, prior ledger decisions, existing cash/installment/asset patterns, and savings schema.
2. Design: define savings routes, request/response shapes, cash-linkage transaction flow, and maturity state rules.
3. Validation planning: add schema unit tests and run existing validation ladder; smoke API with isolated Postgres if available.
4. Implementation: add savings module code and wire it into the application.
5. Verification: run lint/build/tests and optional database/API smoke proof.
6. Harness update: update product/story docs, durable story proof, decision record, and trace.

## Stop Conditions

Pause for human confirmation if:

- Product behavior is ambiguous around early withdrawal, rollover, partial maturity, or interest calculation.
- Data migration or destructive ledger changes become necessary.
- Validation requirements need to be weakened.
- Architecture direction changes away from ledger-derived cash-flow records.
