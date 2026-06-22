# Metaboost Architecture

## Module Dependency Order

| Tier | Packages | Depends On |
| ---- | -------- | ---------- |
| 1 | helpers, helpers-currency, rss-parser, metaboost-signing | (none / external only) |
| 2 | helpers-backend-api, helpers-valkey, helpers-i18n, helpers-requests | helpers |
| 3 | orm, management-orm | helpers (+ helpers-requests for orm) |
| 4 | ui | helpers |
| 5 | api, management-api, web, management-web, web-sidecar, management-web-sidecar | various packages above |

## Directory Structure

- `packages/` — Publishable npm packages (`@metaboost/*`, `metaboost-signing`)
- `apps/` — Deployable applications (api, management-api, web, management-web, sidecars under `apps/*/sidecar/`)
- `tools/` — Development tools (e.g. `generate-data`)
- `infra/` — Docker, env templates, K8s manifests, database linear migrations

## Technologies

- Node.js 24+, TypeScript (strict), npm workspaces
- Next.js, Express, PostgreSQL, TypeORM

## App Descriptions

### apps/api

Express HTTP API for the main app. Routes in `apps/api/src/routes/`. Joi schemas in `apps/api/src/schemas/`.

### apps/management-api

Admin API for management identities, permissions, and events. Separate from main API for security isolation.

### apps/web

Next.js app. Fetches runtime config from `apps/web/sidecar/` when `RUNTIME_CONFIG_URL` is set. Internationalized via `next-intl`.

### apps/management-web

Admin dashboard (Next.js). Uses `@metaboost/ui` and runtime config from its sidecar.

## Common Code Patterns

### Service Pattern

Business logic in `*Service` classes with static methods under `packages/orm/src/services/` and `packages/management-orm/src/services/`.

### Validation Pattern

Joi schemas live in `apps/api/src/schemas/` and `apps/management-api/src/schemas/` only — not in controllers or routes.

### HTTP from apps

Use `@metaboost/helpers-requests` (`req...` pattern); do not use raw `fetch()` in app code.

## Where to Find X

| Looking for... | Location |
| -------------- | -------- |
| API routes | `apps/api/src/routes/` |
| Management API routes | `apps/management-api/src/routes/` |
| Database entities (app) | `packages/orm/src/entities/` |
| Database entities (management) | `packages/management-orm/src/entities/` |
| Database services | `packages/orm/src/services/`, `packages/management-orm/src/services/` |
| Shared helpers | `packages/helpers/src/` |
| Web pages | `apps/web/src/app/` |
| Management pages | `apps/management-web/src/app/` |
| Shared UI | `packages/ui/src/components/` |
| Environment templates | `infra/config/env-templates/`, `apps/*/.env.example` |
| Linear SQL migrations | `infra/k8s/base/ops/source/database/linear-migrations/` |
| K8s manifests | `infra/k8s/` |

## Build Order

From repo root:

```bash
npm run build:packages
npm run build:apps
```

See root `package.json` `build:packages` for the canonical package build sequence.
