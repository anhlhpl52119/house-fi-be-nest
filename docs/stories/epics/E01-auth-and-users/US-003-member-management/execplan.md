# Exec Plan

## Goal

Implement US-003 member management so the current household owner can create the second household member account for the private two-person MVP.

## Scope

In scope:

- Add an authenticated owner-only API for creating one additional household member account with email, display name, and initial password.
- Add an authenticated API for listing active members in the current household.
- Keep business access scoped to the authenticated user's active household membership.
- Validate request bodies with Zod at HTTP boundaries.
- Keep password hashing and duplicate-email handling consistent with US-002 auth behavior.

Out of scope:

- Email delivery, invite tokens, accept-invite workflow, password reset, MFA, and rate limiting.
- Multi-household switching or cross-household membership management.
- Household renaming, deletion, transfer of ownership, or member removal.

## Risk Classification

Risk flags:

- Auth.
- Authorization.
- Public contracts.
- Existing behavior.
- Weak proof.

Hard gates:

- Auth.
- Authorization.

Lane: high-risk.

## Work Phases

1. Discovery of current auth, user, household, and database boundaries.
2. Design a bounded owner-created member account flow for the two-person MVP.
3. Add story validation expectations and durable decision record.
4. Implement household member schemas, controller, service, and module wiring.
5. Verify with lint/build and available tests or smoke checks.
6. Update product docs, durable story proof, and trace.

## Stop Conditions

Pause for human confirmation if:

- The member flow needs to support existing registered users or invite tokens instead of owner-created accounts.
- Data migration, member removal, or household switching becomes necessary.
- Validation requirements need to be weakened.
- Authorization direction changes away from owner-only member creation.
