---
name: swagger-openapi-sync
description: Keep the OpenAPI spec in sync with API endpoints. Use when adding, changing, or removing API routes, request/response bodies, or auth requirements.
---

# Swagger / OpenAPI sync

## Rule

**Whenever you change API endpoints**, update the OpenAPI spec so `{API_VERSION_PATH}/api-docs` (Swagger UI; default `/v1/api-docs`) stays accurate and testable.

- **Add a route** → Add the path, method, requestBody, responses, and (if protected) `security: [{ bearerAuth: [] }]` in the spec.
- **Change request/response shape** → Update the relevant `components.schemas` and path definitions.
- **Remove or rename a route** → Remove or update the path in the spec.
- **Change which routes require auth** → Update the path’s `security` array in the spec.

## Where the spec lives

- **Main API**: `apps/api/src/openapi.ts` exports `openApiDocument` (OpenAPI 3.0). Served at `GET {API_VERSION_PATH}/api-docs` via `swagger-ui-express` in `apps/api/src/lib/api-docs.ts` (`registerApiDocs`).
- **Management API**: `apps/management-api/src/openapi.ts` exports `openApiDocument`. Served at `GET {MANAGEMENT_API_VERSION_PATH}/api-docs` in `apps/management-api/src/app.ts`.

## What to keep in sync

- **Paths**: Every public route under the version prefix (e.g. `GET {API_VERSION_PATH}/health`, `GET {API_VERSION_PATH}/auth/me`, etc.) should have a matching path in `openApiDocument.paths`.
- **Schemas**: Request bodies and response bodies that have a defined shape should use or define a schema under `components.schemas` and reference with `$ref`.
- **Security**: Endpoints that use `requireAuth` must have `security: [{ bearerAuth: [] }]` and document 401 responses.
- **Status codes**: Document the real status codes and (when applicable) response bodies (e.g. 400, 401, 403, 409, 500).

## Checklist when touching the API

After editing any of:

- `apps/api/src/app.ts` (new top-level routes)
- `apps/api/src/routes/*.ts`
- `apps/api/src/controllers/*.ts` (if response/request shape changes)

ask: **Did I update `apps/api/src/openapi.ts`?** If not, update it in the same change set.
