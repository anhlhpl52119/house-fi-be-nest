# US-013 Household Settings

## Current Behavior

Authenticated members can fetch the current household context with `GET /households/current`, and owners can create/list household members. The backend does not yet expose a way to update the household profile created during registration.

## Target Behavior

Owners can update the current household's display name through an authenticated `PATCH /households/current` endpoint. The endpoint derives household scope from the caller's active membership, rejects non-owner members, and returns the updated current-household response.

## Implementation Status

Implemented. `PATCH /api/v1/households/current` validates a strict `{ name }` request body, derives the current household from authenticated membership, requires owner role, updates the existing household name, and returns the current-household response shape.

## Affected Users

- Owner: can rename the current household.
- Member: can continue reading household context and members, but receives `403 Forbidden` when attempting to rename the household.

## Affected Product Docs

- `docs/product/personal-finance-mvp.md`
- `docs/stories/backlog.md`
- `docs/decisions/0009-auth-boundary.md`
- `docs/decisions/0010-member-management-boundary.md`
- `docs/decisions/0018-household-settings-boundary.md`

## Non-Goals

- Household switching or multiple active household selection.
- Invites, member removal, role changes, or ownership transfer.
- Household deletion or data export.
- Schema changes beyond using the existing `households.name` column.
- Product audit logs unless selected in a later story.
