# Validation

## Proof Strategy

US-001 is complete when the backend foundation builds successfully and Harness evidence points to the restored story packet, product contract, and decision record.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | TypeScript compilation for modules, config, and schema definitions. |
| Integration | Deferred until a test database harness exists. Drizzle migration generation may be used as interim proof. |
| E2E | Deferred; no user-visible domain workflows in US-001. |
| Platform | Health endpoint smoke can be run once dependencies are installed and the server starts. |
| Performance | Not applicable for foundation slice. |
| Logs/Audit | Trace and Harness evidence recorded. Runtime request logging deferred. |

## Fixtures

No domain fixtures are required for US-001.

## Commands

Expected commands after scripts exist:

```text
npm run build
npm run lint
npm test
```

If no lint/test implementation exists yet, do not claim those proof columns pass.

## Acceptance Evidence

2026-07-01:

- `npm install` completed and created `package-lock.json`.
- `npm run db:generate` generated `src/database/migrations/0000_numerous_roland_deschain.sql` from 13 Drizzle tables.
- `npm run lint` passed TypeScript no-emit checking.
- `npm run build` passed TypeScript build.
- `npm test` passed with 0 tests discovered; this is smoke evidence only, not behavioral unit coverage.
- Runtime smoke passed: `npm start` then `curl -fsS http://localhost:3000/health` returned `{"status":"ok","timestamp":"..."}`.
- `scripts/bin/harness-cli story verify US-001` passed the configured `npm run build` proof.
