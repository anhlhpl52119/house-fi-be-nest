# Households API

Household routes require bearer auth. Scope is derived from the current user's active membership.

## `GET /households/current`

Returns the current household context.

```json
{
  "data": {
    "id": "uuid",
    "name": "Household",
    "role": "owner"
  }
}
```

## `PATCH /households/current`

Owner-only. Updates the current household display name.

### Body

| Field | Type | Rules |
| --- | --- | --- |
| `name` | string | 1-160 trimmed chars |

### Response

`200 OK` with the current household shape.

## `GET /households/members`

Lists active members in the current household.

### Member shape

| Field | Type |
| --- | --- |
| `id` | household membership UUID |
| `role` | `owner` or `member` |
| `joinedAt` | timestamp string |
| `user` | user summary with `id`, `email`, `displayName`, `avatarUrl` |

## `POST /households/members`

Owner-only. Creates the second member account and attaches it to the owner's household.

### Body

| Field | Type | Rules |
| --- | --- | --- |
| `email` | string | Valid email; normalized to lowercase |
| `password` | string | 8-128 chars |
| `displayName` | string | 1-120 trimmed chars |

### Product rules

- MVP households are limited to two active members.
- Created members can authenticate through `POST /auth/login`.
- Member removal, role changes, ownership transfer, and invites are out of scope.
