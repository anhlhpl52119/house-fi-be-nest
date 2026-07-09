# Personal Finance Backend

NestJS + TypeScript backend for a private two-person household finance app. The API records cash transactions, credit-card spending and settlement, installments, assets, savings deposits, household settings, and derived reports.

## Tech Stack

- **Runtime:** Node.js 22+
- **Framework:** NestJS 11
- **Database:** PostgreSQL
- **ORM/migrations:** Drizzle ORM + drizzle-kit
- **Validation:** Zod
- **Auth:** JWT access tokens + persisted refresh tokens
- **API docs:** Swagger/OpenAPI

## Prerequisites

Install these before starting:

- Node.js **22 or newer**
- npm
- PostgreSQL 16+ locally, or Docker to run PostgreSQL in a container

Check your Node version:

```bash
node --version
```

## Quick Start

From the repository root:

```bash
# 1. Install dependencies
npm install

# 2. Create local environment file
cp .env.example .env

# 3. Start PostgreSQL, then run database migrations
npm run db:migrate

# 4. Start the development server with file watching
npm run start:dev
```

The app starts on:

```text
http://localhost:3000
```

Health check:

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{"status":"ok","timestamp":"2026-01-01T00:00:00.000Z"}
```

Swagger UI:

```text
http://localhost:3000/api/docs
```

OpenAPI JSON:

```text
http://localhost:3000/api/docs-json
```

## Local PostgreSQL Setup

### Option A: Use Docker

This repository does not currently include a `docker-compose.yml`, so the fastest local database is a direct PostgreSQL container:

```bash
docker run --name brimdesk-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=brimdesk_dev \
  -p 5432:5432 \
  -d postgres:16
```

If the container already exists but is stopped:

```bash
docker start brimdesk-postgres
```

To remove the local database container and its data:

```bash
docker rm -f brimdesk-postgres
```

### Option B: Use an Existing PostgreSQL

Create a database manually, then point `DATABASE_URL` in `.env` to it.

Example:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/brimdesk_dev
```

## Environment Variables

Copy `.env.example` to `.env` and adjust values as needed:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/brimdesk_dev
JWT_ACCESS_SECRET=replace-with-local-access-secret
JWT_REFRESH_SECRET=replace-with-local-refresh-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
```

Notes:

- `PORT` defaults to `3000` if unset.
- `DATABASE_URL` defaults to `postgres://postgres:postgres@localhost:5432/postgres` if unset, but using a dedicated dev database is safer.
- JWT secrets must be at least 16 characters.
- Production rejects default development-style JWT secrets.

## Database Migrations

Run migrations against the database in `DATABASE_URL`:

```bash
npm run db:migrate
```

Generate a new migration after changing Drizzle schema files:

```bash
npm run db:generate
```

Migration files live in:

```text
src/database/migrations/
```

The Drizzle config reads `DATABASE_URL` from the environment and falls back to:

```text
postgres://postgres:postgres@localhost:5432/postgres
```

## Development Commands

```bash
# Start dev server with watch mode
npm run start:dev

# Type-check without emitting files
npm run lint

# Build TypeScript into dist/
npm run build

# Run compiled tests from dist/
npm test

# Start the VitePress docs site
npm run docs:dev

# Build static documentation
npm run docs:build

# Generate Drizzle migrations
npm run db:generate

# Apply Drizzle migrations
npm run db:migrate
```

Important: `npm test` looks for compiled test files under `dist/**/*.test.js`, so run `npm run build` before `npm test`.

## Validation Before Opening a PR

Run this sequence before handing off work:

```bash
npm run lint
npm run build
npm test
```

If your change touches database schema, also run:

```bash
npm run db:generate
npm run db:migrate
```

Use a disposable local database when testing migrations for a feature branch.

## API Base Paths

The app uses a global API prefix for business endpoints:

```text
/api/v1
```

The health endpoint is intentionally excluded from that prefix:

```text
GET /health
```

Common endpoint groups:

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me

GET   /api/v1/households/current
PATCH /api/v1/households/current
GET   /api/v1/households/members
POST  /api/v1/households/members

GET  /api/v1/categories
POST /api/v1/categories

GET  /api/v1/cash-transactions
GET  /api/v1/cash-transactions/balance

GET  /api/v1/credit-cards/transactions
POST /api/v1/credit-cards/transactions

GET  /api/v1/installments/plans
GET  /api/v1/installments/payments/upcoming

GET  /api/v1/assets
GET  /api/v1/savings/deposits
GET  /api/v1/reports/monthly-spending
```

Use Swagger at `/api/docs` for the full request and response shapes.

## First Manual Smoke Test

After `npm run db:migrate` and `npm run start:dev`, register a user:

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "owner@example.com",
    "password": "Password123!",
    "displayName": "Owner"
  }'
```

The response includes auth tokens. Use the access token as a bearer token for protected endpoints:

```bash
curl http://localhost:3000/api/v1/auth/me \
  -H 'Authorization: Bearer <accessToken>'
```

## Project Structure

```text
src/
  app.module.ts                 # NestJS root module
  main.ts                       # server bootstrap, global prefix, Swagger setup
  config/                       # environment parsing and config service
  database/                     # Drizzle schema, migrations, database provider
  auth/                         # registration, login, refresh, logout, current user
  households/                   # current household, settings, members
  categories/                   # system and household categories
  cash-transactions/            # manual cash ledger and balance
  credit-cards/                 # credit-card spending and settlement
  installments/                 # installment plans and payments
  assets/                       # asset definitions and buy/sell transactions
  savings/                      # saving deposits and maturity
  reports/                      # derived finance reports
  health/                       # /health smoke endpoint
  openapi/                      # Swagger helpers
```

## Troubleshooting

### `npm run db:migrate` cannot connect

Check that PostgreSQL is running and that `.env` has the right `DATABASE_URL`.

For the Docker setup above:

```bash
docker ps
```

You should see `brimdesk-postgres` listening on port `5432`.

### Port 3000 is already in use

Change `PORT` in `.env`:

```env
PORT=3001
```

Then restart `npm run start:dev`.

### Tests do not run or find no files

Build first:

```bash
npm run build
npm test
```

### Swagger loads but protected endpoints fail

Login or register first, then click **Authorize** in Swagger and paste the access token as a bearer token.

## Harness Documentation

This repository also includes Harness docs for agent-assisted development and validation evidence:

- `AGENTS.md`
- `docs/HARNESS.md`
- `docs/FEATURE_INTAKE.md`
- `docs/ARCHITECTURE.md`
- `docs/TEST_MATRIX.md`
- `docs/stories/`
- `docs/decisions/`
