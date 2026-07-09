# API reference

Business API routes are mounted under `/api/v1`. Endpoint pages list the controller route; prepend `/api/v1` when calling authenticated business APIs. All authenticated endpoints require `Authorization: Bearer <accessToken>` unless noted otherwise.

| Group | Endpoints |
| --- | --- |
| [Health](./health.md) | `GET /health` |
| [Auth](./auth.md) | register, login, refresh, logout, current identity |
| [Households](./households.md) | current household, household settings, member list/create |
| [Categories](./categories.md) | category list/create/update/delete |
| [Cash transactions](./cash-transactions.md) | manual cash ledger and balance |
| [Credit cards](./credit-cards.md) | card spending, pending transactions, settlement payments |
| [Installments](./installments.md) | installment plans, schedules, and payment settlement |
| [Assets](./assets.md) | asset definitions and buy/sell ledgers |
| [Savings](./savings.md) | saving deposits and maturity workflow |
| [Reports](./reports.md) | derived spending, cash-flow, obligation, asset, and saving reports |

## Runtime OpenAPI

When the NestJS app is running, Swagger UI and the generated OpenAPI document are exposed by the application as configured in the Swagger integration. Use Swagger for machine-readable schema details, and this site for workflow context and domain semantics.
