# @metaboost/helpers

Shared utilities for Metaboost: startup env validation and DB field-length constants.

- **Startup validation** – Used by API and web-sidecar. Export `validateStartupRequirements(results)` plus helpers (`validateRequired`, `validatePositiveInteger`, `buildSummary`, `displayValidationResults`). Apps define their own result array and call `validateStartupRequirements` before loading config or starting the server.
- **DB field lengths** – `EMAIL_MAX_LENGTH`, `PASSWORD_HASH_LENGTH`, `SHORT_TEXT_MAX_LENGTH` align with canonical schema in `infra/k8s/base/db/postgres-init/0003_app_schema.sql` (e.g. varchar_email, varchar_password, varchar_short). Use in ORM entities and app validation so values stay in sync.

Build: `npm run build` (from repo root, build packages first).
