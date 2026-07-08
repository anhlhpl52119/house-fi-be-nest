# Stories

Stories are work packets. They turn product intent into bounded implementation
and validation work.

Current selected story packet:

- None. US-013 was implemented; select the next product slice before creating another story packet.

Recent implemented story packets:

- `docs/stories/epics/E02-households/US-013-household-settings/`
- `docs/stories/epics/E02-households/US-012-current-household.md`
- `docs/stories/epics/E10-api-docs/US-011-openapi-swagger.md`

## Normal Story

Use `docs/templates/story.md` for normal feature work.

Suggested path:

```text
docs/stories/epics/E01-domain-name/US-001-short-story-title.md
```

## High-Risk Story

Use `docs/templates/high-risk-story/` when the feature intake classifies work as
high-risk.

Suggested path:

```text
docs/stories/epics/E02-risky-domain/US-012-risky-story-title/
  execplan.md
  overview.md
  design.md
  validation.md
```

## Status Flow

```text
planned -> in_progress -> implemented
                  |
                  v
               changed
                  |
                  v
               retired
```
