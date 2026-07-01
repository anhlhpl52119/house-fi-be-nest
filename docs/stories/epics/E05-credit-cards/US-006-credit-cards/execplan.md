# Exec Plan

## Goal

Implement US-006 credit cards with pending spending records, per-transaction settlement, and generated cash-payment linkage that preserves reporting semantics.

## Scope

In scope:

- Credit-cards NestJS module with controller, service, response types, and Zod request/query schemas.
- Household/category/member validation for credit-card records.
- Transactional resolve flow that creates a cash expense plus payment row and updates the original credit-card transaction.
- Unit tests for credit-card Zod schemas.
- Product docs, story packet, decision, durable story/matrix updates.

Out of scope:

- Partial settlements or multiple payments per credit-card transaction.
- Card account metadata, statement cycles, and card limits.
- Editing/cancelling credit-card transactions after creation.
- Full reports and dashboards.
- Frontend UI.

## Risk Classification

Risk flags:

- Authorization.
- Data model.
- Public contracts.
- Existing behavior.
- Weak proof.
- Multi-domain (credit cards plus generated cash ledger linkage).

Hard gates:

- Household-scoped financial records.
- Generated cash-ledger behavior that must avoid double-counting spending.

## Work Phases

1. Confirm product contract and existing ledger boundary.
2. Create the high-risk story packet and decision record.
3. Implement credit-card request/response schemas and tests.
4. Implement controller/service flow, including transactional settlement.
5. Run lint/build/tests and available DB/API proof.
6. Update Harness records, docs, and trace.

## Stop Conditions

Pause for human confirmation if:

- partial settlement is actually required for US-006;
- generated cash-payment records need category or payer semantics not defined in `PLAN.md`;
- a schema migration is required beyond a safe additive change;
- validation or household scoping requirements need to be weakened.
