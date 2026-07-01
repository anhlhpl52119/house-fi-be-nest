# US-012 Current Household API

## Status

implemented

## Lane

normal

## Product Contract

Expose the authenticated user's current household context so clients can load the active household id, name, and membership role without listing members or inferring it from auth bootstrap flows.

## Relevant Product Docs

- `docs/product/personal-finance-mvp.md`
- `PLAN.md`

## Acceptance Criteria

- Authenticated members can fetch their current household context through `GET /households/current`.
- The response includes the current household id, household name, and the caller's membership role.
- The endpoint resolves data from the authenticated user's active household membership and does not accept household scope from the request.
- Existing validation and build checks still pass after the endpoint is added.

## Design Notes

- Commands: none.
- Queries: read the caller's active household membership.
- API: add `GET /households/current` under the existing authenticated households controller.
- Tables: read `households` and `household_members`; no schema changes.
- Domain rules: only active household membership can resolve current household context.
- UI surfaces: household picker/header bootstrap and authenticated app context.

## Validation

When updating durable proof status, use numeric booleans:
`scripts/bin/harness-cli story update --id <id> --unit 1 --integration 1 --e2e 0 --platform 1`.

| Layer | Expected proof |
| --- | --- |
| Unit | `npm run build && npm test` |
| Integration | `npm run lint && npm run build` |
| E2E | Not required for this thin read-only slice. |
| Platform | Start the app against an isolated Postgres database, register a user, and smoke `GET /api/v1/households/current` with the returned bearer token. |
| Release | Not required. |

## Harness Delta

Add the durable story record for the selected household slice and update product/story docs to reflect that `GET /households/current` is now implemented.

## Evidence

- `npm run lint && npm run build && npm test`
- `scripts/bin/harness-cli story verify US-012`
- Started the app against an isolated Postgres database, registered an owner account, and fetched `GET /api/v1/households/current` with the returned bearer token.
- Verified the response returned the authenticated household id, household name `Owner Household`, and caller role `owner`.
