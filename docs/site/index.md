---
layout: home

hero:
  name: Personal Finance Backend
  text: API documentation
  tagline: Household-scoped NestJS backend for cash flow, cards, installments, assets, savings, and reports.
  actions:
    - theme: brand
      text: Read the guide
      link: /guide/overview
    - theme: alt
      text: API reference
      link: /api/

features:
  - title: Household-first
    details: Every business record is scoped to the authenticated user's current household.
  - title: Ledger semantics
    details: Cash movements, credit-card settlement, installments, assets, and savings are documented with their cash-flow effects.
  - title: Runtime validation
    details: Zod schemas define request boundaries; Swagger remains available at runtime for generated OpenAPI.
---

## Documentation sources

This static site summarizes the implemented API from:

- `docs/product/personal-finance-mvp.md`
- `PLAN.md`
- `src/*/*.controller.ts`
- `src/*/*.schemas.ts`
- `src/*/*.types.ts`

Run locally:

```bash
npm run docs:dev
```

Build static output:

```bash
npm run docs:build
```
