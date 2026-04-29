## Plan: Expiration Env Naming Cutover

Convert all expiration and lifetime env vars to *_EXPIRATION naming convention aligned with Podverse style. This is a breaking cutover with no alias fallback.

## Steps
1. Inventory all env vars representing token, cookie, invitation, session, and TTL expirations.
2. Define target names with *_EXPIRATION suffix and explicit unit semantics.
3. Rename in canonical env templates and examples.
4. Rename in config readers and startup validation in api and management-api.
5. Rename in k8s source env files and generated config/secret projection where applicable.
6. Rename in tests, e2e seed paths, tooling scripts, and docs.
7. Align related Cursor guidance files with Podverse when they reference expiration variable naming or auth/env contracts.
8. Remove old names completely from code, validation, and docs.

## Relevant files
- apps/api/src/config/index.ts
- apps/api/src/lib/startup/validation.ts
- apps/management-api/src/config/index.ts
- apps/management-api/src/lib/startup/validation.ts
- infra/config/local/api.env
- infra/config/local/management-api.env
- apps/api/.env.example
- apps/management-api/.env.example
- infra/k8s/base/stack/workloads.yaml
- docs/development/env/ENV-REFERENCE.md
- docs/development/env/ENV-VARS-CATALOG.md

## Verification
1. Search confirms zero remaining old variable names.
2. Startup validation passes with only new variable names.
3. Authentication and invitation flows pass integration tests.
4. `./scripts/nix/with-env npm run test:e2e:api` passes.
5. If web/management-web auth flows were touched, run targeted E2E make report specs for changed pages.

## Decisions
- Breaking rename now.
- No deprecation aliases.
- No legacy references in docs or comments.
- Cursor alignment is in-scope only for expiration/auth/env-related `.cursor` files touched by this phase.
