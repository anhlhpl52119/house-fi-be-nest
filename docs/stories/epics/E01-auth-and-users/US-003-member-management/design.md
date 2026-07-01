# Design

## Domain Model

Existing tables are sufficient:

- `users`: stores the new member login record.
- `households`: identifies the current household.
- `household_members`: stores active membership with role `owner` or `member`.

Rules:

- The requester must have an active membership in the current household.
- Only an `owner` can create a member account.
- The created account is inserted as role `member` in the owner's household.
- Email must be globally unique.
- The MVP household is limited to two active members.
- Passwords are hashed with Argon2 and are never returned.

## Application Flow

Create member:

1. `AccessTokenGuard` resolves the authenticated user id.
2. `HouseholdsService` resolves the requester's active household membership.
3. Service rejects non-owner requesters.
4. In the create-member transaction, lock the current household row with `FOR UPDATE` so concurrent create requests for the same household serialize before the member-count check.
5. Service validates there is fewer than two active members.
6. Service checks the target email is not already registered.
7. In the same database transaction, insert `users` and `household_members`.
8. Return the created member representation.

List members:

1. `AccessTokenGuard` resolves the authenticated user id.
2. Service resolves the user's active household.
3. Query active members for that household.
4. Return member representations sorted by join time.

## Interface Contract

Routes under `/api/v1`:

```text
POST /households/members
GET  /households/members
```

`POST /households/members` body:

```json
{
  "email": "spouse@example.com",
  "displayName": "Spouse",
  "password": "initial-password"
}
```

Successful create response:

```json
{
  "data": {
    "id": "membership-uuid",
    "role": "member",
    "joinedAt": "2026-07-01T00:00:00.000Z",
    "user": {
      "id": "user-uuid",
      "email": "spouse@example.com",
      "displayName": "Spouse",
      "avatarUrl": null
    }
  }
}
```

Errors:

- `400 validation_error` for invalid request body.
- `401` for missing/invalid access token.
- `403` when a non-owner creates a member.
- `409` when email is already registered or the household already has two active members.

## Data Model

No schema or migration changes are required. Existing unique indexes and role check constraints enforce email uniqueness and membership role integrity. The service locks the household row inside the create-member transaction before counting active members, which prevents two concurrent member-create requests for the same household from both passing the two-member cap check.

## UI / Platform Impact

No UI or platform shell changes in this backend story.

## Observability

No product audit log exists yet. Operational logs remain the NestJS defaults for this story. The Harness trace records implementation and validation evidence.

## Alternatives Considered

1. Attach an already registered user by email.
   - Rejected for US-003 because registration currently creates a default household and the MVP has no household-switching model.
2. Full invite-token workflow.
   - Rejected for US-003 because email delivery and invite acceptance are out of MVP scope for this slice.
3. Let any member create another member.
   - Rejected because membership management is an authorization-sensitive owner action.
