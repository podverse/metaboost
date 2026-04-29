---
name: metaboost-api-patterns
description: Common patterns for the Metaboost HTTP API (Express)
version: 1.0.0
---

# Metaboost API Patterns

- **Location**: `apps/api/`
- **Stack**: Express, TypeScript, ESM

## API change triad (use every time)

When you add or change an API route, update these together:

1. Route/controller/schema implementation in API or management-api.
2. API integration tests (see **api-testing**).
3. OpenAPI spec updates (see **swagger-openapi**).

## Patterns

### Route and handler

```typescript
import { Router, type Request, type Response } from 'express';

const router = Router();

router.get('/health', (_req: Request, res: Response): void => {
  res.json({ status: 'ok', message: 'The server is running.' });
});

export default router;
```

### Config and startup validation

- **Startup validation**: `lib/startup/validation.ts` runs after loadEnv() and before importing config. It validates required env vars (e.g. API_PORT), logs results by category, and throws if any required are missing or invalid. **`WEB_BRAND_NAME`** is required only when **`ACCOUNT_SIGNUP_MODE`** uses email flows (with mailer vars), for transactional email copy. Pattern aligned with Podverse’s API startup validation.
- Read env in `config/index.ts` only after validation has passed.
- Use `.env.example` for documented variables; non-empty values in `.env` use double quotes; empty/unset use no value after `=`.
- **Env alignment**: All `.env` files (including `infra/config/local/*.env`) must match the organization, section comments, and variable order of their authoritative `.env.example`; only values may differ. Generated files are filled by `make local_env_setup` (auto-generated secrets plus overrides from local override files when present). **`WEB_BRAND_NAME`** is set from dev/env-overrides/local/info.env (template contract workload **`info`**). See [docs/development/env/LOCAL-ENV-OVERRIDES.md](../../docs/development/env/LOCAL-ENV-OVERRIDES.md).

### Async handlers

Wrap async route handlers to avoid unhandled rejections (e.g. try/catch and pass errors to Express error middleware, or use a small `asyncHandler` wrapper).

### Request body validation and controller typing

- **Validate at the route**: Use `validateBody(schema)` middleware (Joi) on any route that accepts a JSON body. Validation runs before the controller; invalid requests get 400 with details and never reach the controller.
- **Type the validated body**: In the schema file, export an interface that matches the shape Joi validates (e.g. `CreateAdminBody` for `createAdminSchema`). Use `.default()` in Joi so optional fields have a known shape after validation.
- **Controllers assume valid body**: In the controller, use the validated schema shape (for example the exported body interface from the schema module) and avoid redundant field-type checks. Do **not** repeat “field is required” or “field must be a string” checks for fields already validated by middleware; controllers should only do business checks (e.g. “email already in use”, “display name already in use”, auth checks).
- **Same pattern in management-api**: Apply the same pattern in `apps/management-api`: schemas in `schemas/*.ts` with exported body types, routes using `validateBody(schema)`, controllers using the types and no redundant presence/type checks for validated fields.

## Scripts

- `npm run dev` – Build and run (from `apps/api`)
- `npm run dev:api` – From repo root
- **Tests:** When adding or changing routes or auth behavior, add or update integration tests. Use the **api-testing** skill for file layout (auth.test.ts vs auth-no-mailer vs auth-mailer), base URL (`config.apiVersionPath`), and clean-slate/requirements.
