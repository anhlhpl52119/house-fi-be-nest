# US-014 Project API Documentation Site

## Status

implemented

## Lane

normal

## Product Contract

The backend repository provides a human-readable documentation site for the implemented personal-finance API surface. The site is generated from markdown, uses the existing product and source context as truth, and complements the runtime Swagger document by explaining workflows, authentication, request/response conventions, endpoint groups, and domain rules.

## Relevant Product Docs

- `docs/product/personal-finance-mvp.md`
- `PLAN.md`
- `src/*/*.controller.ts`
- `src/*/*.schemas.ts`
- `src/*/*.types.ts`

## Acceptance Criteria

- A documentation site tool is selected and wired into npm scripts.
- The selected tool can build static docs without requiring the API server or database.
- Documentation exists for shared API conventions and each implemented API group: health, auth, households, categories, cash transactions, credit cards, installments, assets, savings, and reports.
- The docs state core personal-finance domain semantics: VND integer money, household scoping, bearer auth, generated cash flows, and derived reports.
- The story records validation proof and updates the durable Harness matrix.

## Design Notes

- Tooling: use VitePress because this repo already uses markdown-heavy Harness/product docs, and VitePress adds a lightweight static site without requiring React/Next app scaffolding.
- Commands: add `docs:dev`, `docs:build`, and `docs:preview` scripts.
- API: no runtime API behavior changes are planned.
- Tables: no database schema changes are planned.
- Domain rules: docs must distinguish cash flow from spending incurred and document generated ledger rows.
- UI surfaces: static documentation site only.

## Validation

When updating durable proof status, use numeric booleans:
`scripts/bin/harness-cli story update --id US-014 --unit 0 --integration 1 --e2e 0 --platform 1`.

| Layer | Expected proof |
| --- | --- |
| Unit | Not applicable; markdown/config-only story. |
| Integration | `npm run docs:build` renders the full docs site. |
| E2E | Not required; no browser runtime behavior beyond static build. |
| Platform | `npm run lint` and `npm run build` continue to pass after dependency/script changes. |
| Release | Not required for local docs site wiring. |

## Harness Delta

- Adds US-014 as the selected documentation story.
- Keeps generated site output ignored so future agents do not commit static build artifacts.

## Evidence

- `npm run docs:build` passed; VitePress rendered the static documentation site.
- `npm run lint` passed; TypeScript type-check remained clean.
- `npm run build` passed; backend compiled after package/script changes.
- `npm test` passed with 44 schema tests.
