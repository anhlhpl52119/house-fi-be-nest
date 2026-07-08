# 0018 Household Settings Boundary

Date: 2026-07-09

## Status

Accepted

## Context

US-013 adds the first household profile mutation endpoint. Household records scope all finance data, and earlier auth decisions require business endpoints to derive household scope from authenticated active membership rather than trusting client-supplied household ids. Renaming a household is a public API and authorization change because members may read the household context, but settings mutation should remain owner-only for the private two-person MVP.

## Decision

Implement household profile rename as `PATCH /households/current` using the caller's authenticated current active household membership. The request body contains only `name`; it does not accept `householdId` or broader settings fields.

Only active `owner` members can mutate the current household name. Active non-owner members may continue to read `GET /households/current`, but receive `403 Forbidden` for the patch endpoint. The response reuses the current-household shape `{ id, name, role }` so clients can update their bootstrap context without a second read.

Reuse the existing `households.name varchar(160)` column and update `households.updated_at`; no schema migration or product audit log is added for this slice.

## Alternatives Considered

1. `PATCH /households/:id` with a path parameter.
   - Rejected because the MVP has one active current household and prior auth boundaries require deriving household scope server-side.
2. Let any active household member rename the household.
   - Rejected because household settings are access-control-adjacent and should remain owner-only until a broader permissions model is selected.
3. Add a generic settings object.
   - Rejected because only display-name mutation is selected; broader settings would expand validation and public contract surface without current product need.
4. Add audit logs for rename events.
   - Rejected for US-013 scope; product audit logs should be designed as a dedicated slice if required.

## Consequences

Positive:

- Keeps household-scope derivation consistent with auth and member-management boundaries.
- Gives clients a narrow settings mutation without exposing household ids in write requests.
- Reuses existing schema and response shape.

Tradeoffs:

- Members cannot personalize or correct the household display name without owner action.
- Future multi-household or ownership-transfer work must revisit current-household selection and settings permissions.
- Rename events are not retained as product audit records in this slice.

## Follow-Up

- Add household switching before supporting users with multiple active households.
- Add owner transfer, member removal, or invite workflows only as separate selected stories.
- Add product audit logs for household settings changes only if auditability becomes a product requirement.
