# Exec Plan

## Goal

Implement US-007 installments with generated payment schedules, upcoming pending-payment views, and transactional payment settlement into the cash ledger.

## Scope

In scope:

- Installments NestJS module with controller, service, response types, and Zod request/query schemas.
- Household/category/member validation for installment plans.
- Deterministic monthly schedule generation for newly created plans.
- Transactional pay flow that creates a cash expense, updates the scheduled installment payment, and completes the plan when the last payment is paid.
- Unit tests for installment Zod schemas.
- Product docs, story packet, decision, durable story/matrix updates.

Out of scope:

- Cancelling plans or payments.
- Partial payments, over-payments, rescheduling, or editing generated schedules.
- Interest/fee decomposition and amortization calculations.
- Full reports and dashboards.
- Frontend UI.

## Risk Classification

Risk flags:

- Authorization.
- Data model.
- Public contracts.
- Existing behavior.
- Weak proof.
- Multi-domain (installments plus generated cash-ledger linkage).

Hard gates:

- Household-scoped financial records.
- Generated cash-ledger behavior that must avoid double-counting installment spending.

## Work Phases

1. Confirm product contract, ledger boundary, and scheduling assumptions.
2. Create the high-risk story packet and decision record.
3. Implement installment request/response schemas and tests.
4. Implement controller/service flow, including schedule generation and transactional payment settlement.
5. Run lint/build/tests and available DB/API proof.
6. Update Harness records, docs, and trace.

## Stop Conditions

Pause for human confirmation if:

- partial installment payments or cancellation are actually required for US-007;
- due-date month-roll behavior needs a different product rule than last-day clamping;
- a schema migration is required beyond a safe additive change;
- validation or household scoping requirements need to be weakened.
