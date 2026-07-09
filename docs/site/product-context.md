# Product context

The backend supports a private personal-finance app for a two-person household. Both members can see shared household records, and APIs support `paidByUserId` filters where the domain needs attribution.

## Stack

- NestJS and TypeScript
- PostgreSQL/Supabase with Drizzle ORM
- Zod runtime validation at HTTP boundaries
- JWT access tokens with persisted rotating refresh tokens
- Swagger/OpenAPI available from the running API

## Financial rules

- Currency is VND only.
- Money is represented as positive integer VND amounts; do not use floats for money.
- Asset quantities are decimal strings and are normalized by the API.
- Reports are derived from ledger/business records rather than mutable balance fields.
- Generated cash transactions use `sourceType`/`sourceId` to preserve traceability.

## Domain semantics

| Domain | Cash effect | Spending-incurred effect |
| --- | --- | --- |
| Manual cash expense | Immediate cash outflow | Counts as spending |
| Manual cash income | Immediate cash inflow | Does not count as spending |
| Credit-card swipe | No immediate cash movement | Counts when swiped |
| Credit-card settlement | Generated cash outflow | Not counted again as spending |
| Installment plan | No immediate cash movement | Original purchase counts as spending |
| Installment payment | Generated cash outflow | Not counted again as spending |
| Asset buy/sell | Generated cash outflow/inflow | Not lifestyle spending |
| Saving deposit/maturity | Generated cash outflow/inflow | Not lifestyle spending |

## Scope boundaries

The MVP does not include multiple cash accounts, attachments/R2, budgets, recurring bills, product audit logs, live asset prices, exports, or multi-household switching.
