# Design

## Domain Model

`categories` can be either:

- system default rows: `is_system = true`, `household_id = null`, `created_by_user_id = null`;
- household custom rows: `is_system = false`, `household_id` and `created_by_user_id` set.

Rules:

- `type` is `income` or `expense`.
- Hierarchy depth is at most two levels.
- A child category's parent must have the same `type`.
- Custom categories can parent under a system or same-household category.
- A category with children cannot be assigned a parent.
- System categories cannot be created, updated, deleted, or deactivated through user APIs.

## Application Flow

Commands:

- Create custom category for the authenticated user's current household.
- Update custom category fields and optional parent.
- Soft-delete custom category by setting `is_active = false`.

Queries:

- List active system categories and active categories for the authenticated user's current household, with optional `type` filter.

## Interface Contract

Routes under `/api/v1`:

- `GET /categories?type=expense|income`
- `POST /categories`
- `PATCH /categories/:id`
- `DELETE /categories/:id`

Request bodies use Zod validation. Responses are wrapped in `{ data: ... }`.

## Data Model

`categories` adds:

- nullable `household_id` for global system rows;
- nullable `created_by_user_id` for global system rows;
- `description` text;
- `is_system` boolean;
- `background_color`, `text_color`, and `border_color`;
- active/type/ownership indexes.

A database check enforces system rows have null owner fields and custom rows have owner fields.

## UI / Platform Impact

No frontend implementation. The API returns UI-friendly icon and color tokens for future clients.

## Observability

Harness trace records validation evidence. Product audit logging is not implemented yet.

## Alternatives Considered

1. Use literal sample SQL with `user_id` and no `household_id`.
   - Rejected after clarification because the product needs household-shared categories for two members.
2. Seed only a small MVP category set.
   - Rejected after clarification; US-004 includes the full Vietnamese hierarchy supplied by the user.
