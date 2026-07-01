# Exec Plan

## Goal

Implement US-004 categories with household-scoped custom categories, global Vietnamese system defaults, and AI-friendly descriptions.

## Scope

In scope:

- Category schema migration for system defaults and UI color/description fields.
- Seed all provided Vietnamese income/expense system categories.
- Categories module with list/create/update/delete APIs.
- Zod request/query validation and unit tests for category schemas.
- Product docs, backlog, decision, durable story/matrix updates.

Out of scope:

- AI natural-language transaction creation.
- Transaction CRUD and category usage validation in transaction flows.
- Frontend UI.

## Risk Classification

Risk flags:

- Data model.
- Public contracts.
- Existing behavior.
- Weak proof.

Hard gates:

- Migration/data model change to existing `categories` table.

## Work Phases

1. Discovery and clarify ownership model.
2. Create high-risk story packet and decision record.
3. Update schema and migration/seed data.
4. Implement categories module and validation.
5. Run lint/build/tests and available DB proof.
6. Update Harness records and trace.

## Stop Conditions

Pause for human confirmation if:

- Category ownership model changes again.
- Migration would require destructive data loss.
- Validation requirements need to be weakened.
- AI transaction creation scope is requested in this story.
