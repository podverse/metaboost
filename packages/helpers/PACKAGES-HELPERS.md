# @metaboost/helpers

Shared utilities for Metaboost: startup env validation and DB field-length constants.

- **Startup validation** – Used by API and web-sidecar. Export `validateStartupRequirements(results)` plus helpers (`validateRequired`, `validatePositiveInteger`, `buildSummary`, `displayValidationResults`). Apps define their own result array and call `validateStartupRequirements` before loading config or starting the server.
- **DB field lengths** – `EMAIL_MAX_LENGTH`, `PASSWORD_HASH_LENGTH`, `SHORT_TEXT_MAX_LENGTH` align with canonical schema in `infra/k8s/base/db/source/app/0001_app_schema.sql` (e.g. varchar*email, varchar_password, varchar_short). **Public ids:** `nanoid.ts` exports `NANO_ID_V2*\*`, `isValidNanoIdV2IdText`, and `generateRandomIdText`(same contract as Podverse; DB`id_text`columns use`nano_id_v2`).

Build: `npm run build` (from repo root, build packages first).
