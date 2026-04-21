# 02 API And Management API

## Scope

Update API behavior so users can pre-accept upcoming terms and clients can render current/upcoming terms state from server data.

## Key Files

- [apps/api/src/lib/terms-policy/index.ts](apps/api/src/lib/terms-policy/index.ts)
- [apps/api/src/controllers/authController.ts](apps/api/src/controllers/authController.ts)
- [apps/api/src/routes/auth.ts](apps/api/src/routes/auth.ts)
- [apps/api/src/schemas/auth.ts](apps/api/src/schemas/auth.ts)
- [apps/api/src/openapi.ts](apps/api/src/openapi.ts)
- [packages/helpers-requests/src/types/auth-types.ts](packages/helpers-requests/src/types/auth-types.ts)
- [packages/helpers-requests/src/web/auth.ts](packages/helpers-requests/src/web/auth.ts)
- [apps/management-api/src](apps/management-api/src)

## Steps

1. Extend terms policy evaluation payload to include:
   - current version metadata/content
   - upcoming version metadata/content (nullable)
   - user acceptance state for each relevant version.
2. Change `PATCH /auth/terms-acceptance` behavior:
   - Keep one acceptance action.
   - Server resolves target terms version (upcoming when applicable, else current).
   - Guard against ambiguity by relying on the single-upcoming DB constraint.
3. Extend `/auth/me` auth payload for web banner and `/terms` rendering:
   - include fields for “needs upcoming acceptance” and acceptance deadline.
4. Add management-api endpoints for terms admin:
   - list versions, create draft/upcoming, promote upcoming->current, demote old current->deprecated via controlled transitions.
   - validate no invalid status transitions and no second upcoming row.
5. Update OpenAPI docs and helpers-requests types/functions for all changed contracts.
6. Remove legacy status handling from API/management-api code paths (hard break only).

## Verification

- API integration tests:
  - pre-accept upcoming terms records correct `terms_version_id`.
  - acceptance after grace/enforcement still works via single action.
  - auth payload flags/banner fields are correct across phase boundaries.
- Management-api integration tests:
  - invalid transition rejection
  - duplicate upcoming rejection
  - promotion/demotion correctness (`upcoming` -> `current`, prior `current` -> `deprecated`).
