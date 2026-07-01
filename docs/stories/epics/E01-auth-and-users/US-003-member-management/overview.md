# Overview

## Current Behavior

US-002 lets a user register, login, refresh/logout, and fetch current identity. Registration creates a default household with the registering user as owner. There is no API for adding the second household member or listing household members.

## Target Behavior

An authenticated household owner can create the second member account directly for the current household by submitting email, display name, and an initial password. The new member is active immediately and can login through the existing auth API.

Authenticated household members can list active members in their current household.

## Affected Users

- Household owner: can create the second member account.
- Household member: can login after account creation and list household members.

## Affected Product Docs

- `docs/product/personal-finance-mvp.md`
- `docs/stories/backlog.md`
- `docs/decisions/0009-auth-boundary.md`
- `docs/decisions/0010-member-management-boundary.md`

## Non-Goals

- Email invite delivery or invite-token acceptance.
- Attaching already registered users.
- Multi-household switching.
- Member removal or role updates.
