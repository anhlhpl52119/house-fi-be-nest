# US-010 Reports Exec Plan

## Goal

Ship the first reports slice for the personal finance backend by exposing read-only, household-scoped derived reports across completed ledger domains.

## Scope

In scope:

- High-risk story packet and durable story record for US-010.
- Reports module, controller, service, schemas, and response types.
- Monthly spending incurred report.
- Cash-flow report.
- Upcoming obligations report.
- Asset summary report.
- Savings summary report.
- Unit tests for report request schemas.
- Product docs, story evidence, validation matrix, and decision record updates.

Out of scope:

- Database schema changes unless a blocker appears.
- Budgeting, recurring transactions, charts, exports, or frontend work.
- Asset market values and PnL.
- New write workflows or corrections to historical ledgers.

## Risk Classification

Risk flags:

- Authorization: every report must be scoped by the current household.
- Public contracts: adds user-visible API endpoints and response DTOs.
- Existing behavior: report semantics must preserve prior ledger decisions and avoid double-counting.
- Weak proof: prior slices mostly rely on schema tests plus smoke validation rather than full integration tests.
- Multi-domain: reports read cash, credit-card, installment, asset, and savings domains.

Hard gates:

- Authorization.

Lane: high-risk.

## Work Phases

1. Discovery: read product reporting semantics, backlog, prior ledger decisions, and existing module patterns.
2. Design: define report endpoint contracts and double-counting rules.
3. Validation planning: add schema unit tests and an API smoke plan.
4. Implementation: add the reports module and derived query logic.
5. Verification: run lint, build, unit tests, story verification, migration smoke, and API smoke where possible.
6. Harness update: update product docs, durable story proof, decision records, and trace.

## Stop Conditions

Pause for human confirmation if:

- A report must change existing ledger semantics.
- A schema migration becomes necessary.
- Validation commands need to be weakened.
- Authorization scope cannot be proven from current membership.
