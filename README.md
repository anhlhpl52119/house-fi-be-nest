# Personal Finance Backend

A NestJS API for a private two-person household finance app. It manages cash and credit-card transactions, installments, assets, savings, household settings, and financial reports.

**Stack:** Node.js 22+, NestJS 11, PostgreSQL, Drizzle ORM, Zod, JWT, and Swagger/OpenAPI.

## Quick Start

### Requirements

- Node.js 22 or newer
- npm
- PostgreSQL 16+ (local or Docker)

### Run locally

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run start:dev
```

The database configured by `DATABASE_URL` must be running before migrations are applied.

| Resource | URL |
| --- | --- |
| API | `http://localhost:3000/api/v1` |
| Health check | `http://localhost:3000/health` |
| Swagger UI | `http://localhost:3000/api/docs` |
| OpenAPI JSON | `http://localhost:3000/api/docs-json` |

## Available Scripts

| Script | Purpose |
| --- | --- |
| `npm run start:dev` | Start the API in development mode with file watching. |
| `npm run build` | Compile TypeScript to `dist/`. |
| `npm start` | Run the compiled API from `dist/main.js`; build first. |
| `npm run lint` | Type-check the project without emitting files. |
| `npm test` | Run compiled tests in `dist/**/*.test.js`; build first. |
| `npm run db:generate` | Generate Drizzle migrations after schema changes. |
| `npm run db:migrate` | Apply pending migrations to `DATABASE_URL`. |
| `npm run docs:dev` | Start the VitePress documentation site. |
| `npm run docs:build` | Build the static documentation site. |
| `npm run docs:preview` | Preview the built documentation site. |

### Common workflows

Development:

```bash
npm run start:dev
```

Validate a change:

```bash
npm run lint
npm run build
npm test
```

Change the database schema:

```bash
npm run db:generate
npm run db:migrate
```

Work on documentation:

```bash
npm run docs:dev
```

## Local Database with Docker

If PostgreSQL is not already available locally:

```bash
docker run --name brimdesk-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=brimdesk_dev \
  -p 5432:5432 \
  -d postgres:16
```

Then set the connection in `.env`:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/brimdesk_dev
```

Restart an existing container with `docker start brimdesk-postgres`.

## Configuration

Copy `.env.example` to `.env`. The main settings are:

| Variable | Description |
| --- | --- |
| `NODE_ENV` | Runtime environment. |
| `PORT` | API port; defaults to `3000`. |
| `DATABASE_URL` | PostgreSQL connection string. |
| `JWT_ACCESS_SECRET` | Access-token signing secret; minimum 16 characters. |
| `JWT_REFRESH_SECRET` | Refresh-token hashing secret; minimum 16 characters. |
| `JWT_ACCESS_EXPIRES_IN` | Access-token lifetime, such as `15m`. |
| `JWT_REFRESH_EXPIRES_IN` | Refresh-token lifetime, such as `30d`. |

Production rejects the default development JWT secrets.

## Documentation

Human-readable API guides live in `docs/site/` and can be viewed with `npm run docs:dev` (usually at `http://localhost:5173`). Use Swagger for the complete runtime request and response schemas.

Agent-assisted development guidance is available in:

- `AGENTS.md`
- `docs/HARNESS.md`
- `docs/FEATURE_INTAKE.md`
- `docs/ARCHITECTURE.md`
- `docs/TEST_MATRIX.md`
