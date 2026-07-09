# Categories API

Categories classify income and expense records. Routes require bearer auth.

## Rules

- `type` is `income` or `expense`.
- System categories are global and read-only for normal API users.
- Household custom categories are shared by both members.
- Category hierarchy supports a maximum depth of two levels.
- A child category must have the same type as its parent.

## `GET /categories`

Lists active system categories plus household categories.

### Query

| Field | Type | Rules |
| --- | --- | --- |
| `type` | string | Optional `income` or `expense` |

## `POST /categories`

Creates a household custom category.

### Body

| Field | Type | Rules |
| --- | --- | --- |
| `name` | string | 1-120 trimmed chars |
| `type` | string | `income` or `expense` |
| `parentId` | UUID or null | Optional; same-household/system parent with same type |
| `icon` | string | Optional; 1-80 chars |
| `backgroundColor` | string | Optional hex color like `#EFF6FF` |
| `textColor` | string | Optional hex color |
| `borderColor` | string | Optional hex color |
| `description` | string | Optional; 1-1000 chars |
| `sortOrder` | number | Optional integer 0-100000 |

## `PATCH /categories/{id}`

Updates a household custom category. At least one field must be provided. Nullable visual/text fields can be set to `null`.

## `DELETE /categories/{id}`

Soft-deletes a household custom category.

### Response fields

Category responses include `id`, `householdId`, `parentId`, `name`, `type`, visual fields, `description`, `isSystem`, `sortOrder`, `isActive`, `createdAt`, and `updatedAt`.
