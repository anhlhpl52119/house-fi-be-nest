# 0010 Member Management Boundary

Date: 2026-07-01

## Status

Accepted

## Context

US-003 needs a way to add the second household member for the private two-person MVP. The product plan mentions household invite/member management, but the current auth boundary creates a default household on registration and does not support invite tokens, email delivery, existing-user attachment, or household switching.

This is an auth and authorization boundary because member creation creates login credentials, modifies household membership, and establishes who can access future household-scoped financial records.

## Decision

Implement US-003 as an owner-created member account flow.

The authenticated current household owner can create the second member account by providing email, display name, and an initial password. The backend hashes the password with Argon2, creates the user, and inserts an active `member` role in the owner's household in one database transaction.

The MVP household is limited to two active members. Member creation is owner-only. The create-member transaction locks the current household row before checking the active-member count so concurrent create requests for the same household serialize before insertion. Members can use the existing login endpoint after creation and can list active members in their current household.

Do not attach already registered users in US-003, because registration already creates a default household and there is no selected-household model yet. Do not add email invite tokens until a future story selects that workflow explicitly.

## Alternatives Considered

1. Attach an existing registered user by email.
   - Rejected because it creates multiple active memberships without a current-household selection model.
2. Full invite token and accept-invite flow.
   - Rejected because email delivery, invite persistence, and acceptance UX are outside this MVP slice.
3. Allow non-owner members to add household members.
   - Rejected because member management controls access to household-scoped financial data.

## Consequences

Positive:

- The private two-person MVP can reach the required two-member household state.
- Future financial APIs can rely on active household membership and owner-managed access.
- No database migration is required for this slice.

Tradeoffs:

- The owner must communicate the initial password outside the system.
- Existing registered users cannot be attached to another household yet.
- A future invite-token flow may supersede this simplified private-MVP behavior.

## Follow-Up

- Add password reset or user-managed password change when selected.
- Add full invite-token workflow only if the product needs email-based onboarding.
- Add household switching before supporting users with multiple active households.
