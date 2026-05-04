# version-all-api-routes

**Started:** 2026-05-03  
**Author:** Developer + Agent  
**Context:** Align Metaboost main and management APIs: unversioned `GET /` → 404 JSON; Swagger UI under `{API_VERSION_PATH}/api-docs`.

### Session 1 - 2026-05-03

#### Prompt (Developer)

Version all API routes (Podverse + Metaboost)

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Main API: `registerApiDocs` mounts at `${config.apiVersionPath}/api-docs` (+ `mbrss-v1`, `mb-v1` subpaths); exported `versionedApiDocsBasePath()` for a single source of path strings.
- Main and management APIs: unversioned `GET /` returns `404` with `{ message: 'Not found' }` (versioned roots unchanged).
- README, OpenAPI header comments, swagger-openapi skill, and integration tests updated for versioned Swagger URLs.

#### Files Modified

- apps/api/src/lib/api-docs.ts
- apps/api/src/app.ts
- apps/api/src/openapi.ts
- apps/api/src/test/root-routes.test.ts
- apps/management-api/src/app.ts
- apps/management-api/src/openapi.ts
- apps/management-api/src/test/root-routes.test.ts
- apps/management-api/src/test/management-api.test.ts
- README.md
- .cursor/skills/swagger-openapi/SKILL.md
- .llm/history/active/version-all-api-routes/version-all-api-routes-part-01.md

### Session 2 - 2026-05-03

#### Prompt (Developer)

@podverse/apps/api/src/app.ts:48-50 even though the root / path in all of our apis and mgmt apis should not be used for readiness checks (we want to use versioned paths for that) we want to keep the root path functional with a basic success response. it should also be above all the route registrations including the health checks. we won't use this root / for anything meaningful, but devs may want to visit this root for a manual status check

#### Key Decisions

- Metaboost main API: `GET /` returns `200` with `{ status: 'ok', message: 'API is online' }`, registered immediately after body-parser middleware and **before** `registerApiDocs` and versioned router (health remains versioned).
- Metaboost management-api: `GET /` returns `200` with `{ status: 'ok', message: 'Management API is online' }`, registered **before** Swagger and versioned routes.

#### Files Modified

- apps/api/src/app.ts
- apps/management-api/src/app.ts
- apps/api/src/test/root-routes.test.ts
- apps/management-api/src/test/root-routes.test.ts
- .llm/history/active/version-all-api-routes/version-all-api-routes-part-01.md
