# Exec Plan

## Goal

Implement US-008 assets with household asset definitions, immutable buy/sell ledgers, derived holding quantities, and transactional cash-ledger linkage.

## Scope

In scope:

- Assets NestJS module with controller, service, response types, and Zod request/query schemas.
- Household/member validation for asset records.
- Decimal quantity validation and derived holding calculations.
- Transactional asset buy/sell flow that creates a generated cash transaction and links both records.
- Unit tests for asset Zod schemas.
- Product docs, story packet, decision, durable story/matrix updates.

Out of scope:

- PnL, market valuation, price feeds, broker/provider integrations.
- Transaction edits/deletes or asset deactivation APIs.
- Transfers, splits, dividends, staking, fees, or lots.
- Full reports and dashboards.
- Frontend UI.

## Risk Classification

Risk flags:

- Authorization.
- Data model.
- Public contracts.
- Existing behavior.
- Weak proof.
- Multi-domain (assets plus generated cash-ledger linkage).

Hard gates:

- Household-scoped financial records.
- Generated cash-ledger behavior that affects balance and must not be confused with lifestyle spending.

## Work Phases

1. Confirm product contract, cash-ledger boundary, and asset table shape.
2. Create the high-risk story packet and decision record.
3. Implement asset request/response schemas and tests.
4. Implement controller/service flow, including derived holdings and transactional cash linkage.
5. Run lint/build/tests and available DB/API proof.
6. Update Harness records, docs, and trace.

## Stop Conditions

Pause for human confirmation if:

- short selling or negative holdings are actually required for US-008;
- asset transaction edits/deletes are required in the first slice;
- schema migration is required beyond a safe additive change;
- validation or household scoping requirements need to be weakened.
