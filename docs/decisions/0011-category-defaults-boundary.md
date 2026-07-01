# 0011 Category Defaults Boundary

Date: 2026-07-01

## Status

Accepted

## Context

US-004 introduces category APIs and default category data. The existing product contract says financial records are household-scoped, but the supplied Vietnamese seed SQL represents system categories with nullable ownership and no `household_id`.

The category ownership model affects future cash transaction, credit-card, installment, saving, asset, and AI transaction parsing flows because those domains reference categories.

## Decision

Use a hybrid category model:

- system categories are global defaults with `is_system = true`, `household_id = null`, and `created_by_user_id = null`;
- custom categories are owned by a household with `is_system = false`, `household_id` set, and `created_by_user_id` set;
- authenticated users can read active system categories plus active custom categories for their current household;
- authenticated users can create, update, and soft-delete only custom categories in their current household;
- system categories are seeded with Vietnamese names, icons, UI colors, and AI-readable descriptions from the user-provided hierarchy.

Keep `household_id` for custom categories rather than switching to `user_id`, so both household members share custom category definitions.

## Alternatives Considered

1. Match the sample SQL literally with nullable `user_id` and no `household_id`.
   - Rejected because user-specific custom categories would conflict with the product rule that both household members share household-scoped financial records.
2. Seed default categories into each household during registration.
   - Rejected for US-004 because global system rows avoid duplicating static taxonomy data and still allow household custom categories later.
3. Store a single `color` field.
   - Rejected because the supplied data carries separate background, text, and border colors that future clients can use directly.

## Consequences

Positive:

- Future transaction APIs can offer useful Vietnamese default categories without per-household duplication.
- AI transaction parsing has explicit descriptions to guide category matching.
- Household members share custom category definitions.

Tradeoffs:

- Category queries must include both global system rows and current-household rows.
- Database checks and application services must distinguish system rows from mutable custom rows.
- A future admin-only system-category management flow would need separate authorization.

## Follow-Up

- Add AI transaction parsing only in a future story.
- Add category usage checks before hard deletion if deletion semantics change beyond soft-delete.
- Add OpenAPI documentation when API documentation is selected.
