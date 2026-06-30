# Design

## Domain Model

US-001 defines the persistence foundation for these domains:

- `users`, `refresh_tokens` for authentication identity and refresh token storage.
- `households`, `household_members` for household ownership and data scope.
- `categories` for two-level income/expense classification.
- `cash_transactions` for real cash-impacting ledger entries.
- `credit_card_transactions`, `credit_card_payments` for incurred credit-card spending and settlement.
- `installment_plans`, `installment_payments` for original installment purchases and monthly cash payments.
- `assets`, `asset_transactions` for buy/sell asset ledgers.
- `saving_deposits` for savings principal, interest, and maturity.

Amounts are positive. Direction is represented by type/status columns. Type/status values use varchar plus CHECK constraints, not native enums.

## Application Flow

Foundation flow:

1. `main.ts` bootstraps NestJS.
2. `ConfigModule` validates environment variables with Zod before runtime use.
3. `DatabaseModule` provides a Drizzle Postgres database client.
4. `HealthModule` exposes `GET /health` for a smoke check.

Domain command/query handlers are deferred to later stories.

## Interface Contract

Initial public endpoint:

```txt
GET /health
200 OK
{
  "status": "ok",
  "timestamp": "ISO datetime"
}
```

Future API routes should use `/api/v1` and kebab-case resource names per `PLAN.md` and API design guidance.

## Data Model

Drizzle schema files live under `src/database/schemas/` and are exported from `src/database/schema.ts`.

Rules:

- UUID primary keys with `defaultRandom()`.
- `timestamptz` timestamps.
- `date` for business dates.
- `bigint` mode number for VND amounts.
- `numeric(30, 10)` for asset quantities.
- CHECK constraints for allowed status/type strings and positive amounts.
- Indexes from `PLAN.md` for common household/date/status lookups.

## UI / Platform Impact

No UI or platform-shell changes. The health endpoint enables later platform smoke proof.

## Observability

US-001 keeps observability minimal:

- Health endpoint returns current timestamp.
- Structured request logging can be added in a later operational story.

## Alternatives Considered

1. Full MVP in one story: rejected due to high risk and weak proof.
2. Schema-only implementation: rejected because US-001 needs a runnable backend foundation.
3. Native PostgreSQL enums: rejected per `PLAN.md` enum policy.
