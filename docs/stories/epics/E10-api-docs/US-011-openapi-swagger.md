# US-011 OpenAPI Swagger Integration

## Status

implemented

## Lane

normal

## Product Contract

Expose generated OpenAPI documentation for the existing NestJS REST API so developers can inspect available routes and authenticate with the bearer token scheme from Swagger UI.

## Relevant Product Docs

- `docs/product/personal-finance-mvp.md`
- `PLAN.md`

## Acceptance Criteria

- The NestJS app generates an OpenAPI document at startup for the current API surface.
- Swagger UI is exposed from the running app at a stable route.
- The document advertises the bearer authentication scheme used by protected endpoints.
- Request bodies, path params, query params, and response envelopes are described for the current REST endpoints.
- Existing build validation still passes after Swagger is integrated.

## Design Notes

- Commands: none.
- Queries: none.
- API: add Swagger UI and JSON document exposure without changing existing business endpoint behavior.
- Tables: none.
- Domain rules: documentation only; no financial rules change.
- UI surfaces: Swagger UI for developer inspection.

## Validation

When updating durable proof status, use numeric booleans:
`scripts/bin/harness-cli story update --id <id> --unit 1 --integration 1 --e2e 0 --platform 0`.

| Layer | Expected proof |
| --- | --- |
| Unit | Not required for bootstrap-only Swagger wiring. |
| Integration | `npm run lint && npm run build` |
| E2E | Not required for this slice. |
| Platform | Start the app and fetch the generated Swagger document endpoint. |
| Release | Not required. |

## Harness Delta

Add a durable story record for the Swagger documentation slice and capture proof after wiring is complete.

## Evidence

- `npm run lint && npm run build`
- Started `node dist/main.js` and fetched `http://127.0.0.1:3000/api/docs-json`
- Verified the generated spec title is `Personal Finance Backend API`, version is `1.0.0`, it exposes 31 paths, and it includes the `bearer` security scheme.
- Verified enriched schemas in the generated spec, including:
  - `POST /api/v1/auth/register` request body fields `displayName`, `email`, and `password`;
  - `POST /api/v1/auth/register` response envelope fields `user`, `household`, and `tokens`;
  - `GET /api/v1/reports/monthly-spending` query params `month` and `paidByUserId`;
  - `GET /api/v1/cash-transactions/{id}` path param `id`.
