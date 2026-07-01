# Overview

## Current Behavior

The database has an initial `categories` table shape, but there is no categories module, API, category validation flow, or default category data. Registration does not seed categories.

The initial table is household-only and lacks AI-readable Vietnamese descriptions, system/default ownership markers, and separate UI color fields.

## Target Behavior

US-004 establishes categories as a two-level income/expense hierarchy with global Vietnamese system defaults and household-owned custom categories.

Authenticated household members can list system categories plus their household categories, filter by type, and create/update/delete household categories. The API enforces maximum depth of two levels, same-type parents, and no mutation of system categories.

## Affected Users

- Household owner/member: can use Vietnamese default income/expense categories immediately.
- Future AI transaction creation flow: can use category names and descriptions as clear classification hints.

## Affected Product Docs

- `docs/product/personal-finance-mvp.md`
- `docs/stories/backlog.md`
- `docs/decisions/0011-category-defaults-boundary.md`

## Non-Goals

- AI transaction creation from natural language.
- Transaction CRUD.
- Per-household category seeding during registration.
- Category usage checks before soft delete; US-004 soft-deletes custom categories.
