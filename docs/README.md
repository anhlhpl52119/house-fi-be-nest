# Documentation Map

This directory holds the project harness and any product contract derived from a
future user-provided spec.

## Main Files

- `HARNESS.md`: how humans and agents collaborate.
- `FEATURE_INTAKE.md`: how prompts become tiny, normal, or high-risk work.
- `ARCHITECTURE.md`: architecture discovery and boundary rules.
- `TEST_MATRIX.md`: legacy proof map; current proof status is queried with
  `scripts/bin/harness-cli query matrix`.
- `HARNESS_BACKLOG.md`: legacy improvement list; current improvement records
  are stored with `scripts/bin/harness-cli backlog`.
- `GLOSSARY.md`: shared terms.

## Folders

- `product/`: current product truth derived from the personal-finance backend plan.
- `stories/`: feature packets and backlog.
- `decisions/`: durable decisions and tradeoffs.
- `site/`: VitePress static documentation site for the implemented API surface.
- `demo/`: concrete walkthroughs that show how the harness transforms input
  into agent-ready work.
- `templates/`: reusable spec-intake, story, plan, decision, and validation
  formats.

## Current State

The repository now contains an implemented NestJS personal-finance backend plus
Harness records. Use `docs/product/personal-finance-mvp.md` for product truth,
`docs/stories/` for implementation history, and `docs/site/` for the generated
human-readable API documentation site.
