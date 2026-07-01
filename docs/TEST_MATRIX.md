# Test Matrix

This file maps product behavior to proof.

Product behavior is tracked in durable Harness records and summarized here. Do not mark a row implemented until tests or validation evidence exist.

## Status Values

| Status | Meaning |
| --- | --- |
| planned | Accepted as intended behavior, not implemented |
| in_progress | Actively being built |
| implemented | Implemented and proof exists |
| changed | Contract changed after earlier implementation |
| retired | No longer part of the product contract |

## Matrix

| Story | Contract | Unit | Integration | E2E | Platform | Status | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| US-001 | `docs/product/personal-finance-mvp.md` | yes | no | no | yes | implemented | `npm run lint`, `npm run build`, `npm run db:generate`, and `/health` smoke passed on 2026-07-01. |
| US-002 | `docs/stories/epics/E01-auth-and-users/US-002-auth-and-user-identity/` | no | yes | yes | yes | implemented | `npm run lint`, `npm run build`, `npm test`, isolated Postgres `db:migrate`, `/health` smoke, and auth API E2E smoke passed on 2026-07-01. |
| US-007 | `docs/stories/epics/E06-installments/US-007-installments/` | yes | yes | yes | yes | implemented | `npm run lint`, `npm run build`, `npm test`, isolated Postgres `db:migrate`, and installment API smoke passed on 2026-07-01. |

## Evidence Rules

- Unit proof covers pure domain and application rules.
- Integration proof covers backend enforcement, data integrity, provider
  behavior, jobs, or service contracts.
- E2E proof covers user-visible browser flows.
- Platform proof covers only shell, deployment, mobile, desktop, or runtime
  behavior that cannot be proven in lower layers.
- A story can be implemented without every proof column if the story packet
  explains why.
