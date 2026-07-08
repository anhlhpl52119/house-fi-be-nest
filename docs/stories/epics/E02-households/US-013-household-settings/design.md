# US-013 Household Settings Design

## Domain Model

- Household profile: existing `households` row scoped by the caller's active household membership.
- Mutable field for this slice: `name` only.
- Role rule: only `owner` can update household settings; `member` can read but not mutate.
- Boundary rule: the request body must not carry `householdId`; the backend derives the current household from authenticated membership.

## Application Flow

1. `AccessTokenGuard` authenticates the request and populates `request.auth.userId`.
2. Controller parses the JSON body with a Zod schema.
3. Service resolves the caller's current active household membership.
4. Service rejects non-owner callers with `ForbiddenException`.
5. Service updates the existing household row by resolved household id.
6. Service returns `{ id, name, role }`, matching the current-household response shape.

## Interface Contract

Route, served under the existing `/api/v1` global prefix:

```text
PATCH /households/current
Authorization: Bearer <accessToken>
Content-Type: application/json
```

Request body:

```json
{
  "name": "Gia đình An"
}
```

Validation expectations:

- `name` is required.
- `name` is a non-empty string after trimming.
- `name` length must fit the existing `households.name` column (`varchar(160)`).
- Unknown fields are rejected by strict Zod validation.

Success response:

```json
{
  "data": {
    "id": "<household-id>",
    "name": "Gia đình An",
    "role": "owner"
  }
}
```

Expected errors:

- `400 validation_error` for invalid body.
- `401 Unauthorized` for missing/invalid auth or no active household membership.
- `403 Forbidden` when the caller is an active non-owner member.

## Data Model

- Reuse existing `households.name varchar(160) not null`.
- No migration is expected.
- Update `households.updated_at` consistently with existing timestamp conventions if the current schema/helper supports it.
- Continue reading `household_members.role` and `household_members.is_active` to derive authorization.

## UI / Platform Impact

- Enables a future household settings screen to rename the displayed household.
- Existing client bootstrap can refresh `GET /households/current` or use the `PATCH` response directly.
- No mobile/desktop-specific behavior.

## Observability

- Existing request logging, if present, should include route/status/duration.
- Product audit logs are explicitly out of scope for this slice; if audit logging becomes required, record a new decision before implementation.

## Alternatives Considered

1. `PATCH /households/:id` with a path id.
   - Rejected for this slice because the product has one active current household and prior auth decisions require deriving household scope server-side rather than accepting household ids from clients.
2. Allow any member to rename the household.
   - Rejected because household settings are access-control-adjacent and should remain owner-only until a broader permissions model exists.
3. Add a generic settings object.
   - Rejected because only `name` is selected; broader settings would expand the public contract and validation surface.
