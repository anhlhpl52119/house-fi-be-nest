# US-013 Household Settings Exec Plan

## Goal

Add the next household-management slice: owner-scoped household profile rename for the authenticated current household.

## Scope

In scope:

- Add request validation for updating the current household name.
- Add `PATCH /households/current` under the existing authenticated households controller.
- Resolve household scope from the access token's authenticated user and active membership.
- Require the caller's current membership role to be `owner` before mutating the household.
- Update the existing `households.name` value and return the same shape as `GET /households/current`.
- Document the endpoint through Swagger/OpenAPI decorators.
- Add unit/schema proof plus an isolated Postgres API smoke covering owner success and member rejection.

Out of scope:

- Household switching, multiple-household membership, invites, member removal, role changes, or owner transfer.
- Household deletion, archival, or data migration.
- Product audit logs and rate limiting.
- UI implementation.

## Risk Classification

Risk flags:

- Authorization: only owners may rename the household.
- Public contracts: adds an authenticated write endpoint and request body.
- Existing behavior: extends the current household API surface added by US-012.
- Weak proof: household service/controller behavior has limited direct test coverage.

Hard gates:

- Authorization.

Lane: high-risk.

## Work Phases

1. Discovery: inspect existing household controller/service/schema patterns and prior auth/member-management decisions.
2. Design: confirm the request/response schema, route, authorization check, and no-schema-change data model.
3. Validation planning: define schema/unit, build/lint, and isolated Postgres smoke proof.
4. Implementation: add the smallest vertical slice in households schemas/types/service/controller and Swagger metadata.
5. Verification: run lint/build/test and an isolated API smoke for owner success plus member `403`.
6. Harness update: update product docs, story evidence, matrix proof, and trace.

## Stop Conditions

Pause for human confirmation if:

- The endpoint expands beyond household name into broader settings.
- The implementation appears to require data migration, household switching, or ownership transfer.
- Non-owner mutation semantics are requested.
- Validation requirements need to be weakened.
- Architecture direction changes away from deriving household scope server-side.
