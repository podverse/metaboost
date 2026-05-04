### Session 1 - 2026-05-02

#### Prompt (Developer)

continue debugging, run k8s commands as needed to debug and propose a fix (or fix the code if you see what needs fixing in it)

#### Key Decisions

- Confirmed root cause: `terms_version` had zero rows on alpha `metaboost_app`; login
  succeeded through password check then threw in `buildAuthUserJson` → `findCurrentOrThrow`
  (`No current or upcoming terms version found`). Generic Express handler returned 500
  without logging.
- Immediate cluster mitigation: `kubectl rollout restart deploy/api -n metaboost-alpha`
  re-ran `validateTermsVersionReady` / `assertConfiguredForStartup`, inserting default
  terms row.
- Durable fix: add linear migration `0003_terms_default_seed.sql` (idempotent WHEN NOT
  EXISTS current/upcoming) so migrations leave DB consistent before API traffic; wire into
  `infra/k8s/base/ops/kustomization.yaml`.
- Reordered `login` and `refresh` to call `buildAuthUserJson` before creating refresh tokens
  and setting cookies, avoiding orphan sessions on serialization failure.
- Log unhandled errors with `console.error` in `apps/api/src/app.ts` error middleware.

#### Files Modified

- `infra/k8s/base/ops/source/database/linear-migrations/app/0003_terms_default_seed.sql`
- `infra/k8s/base/ops/kustomization.yaml`
- `apps/api/src/app.ts`
- `apps/api/src/controllers/authController.ts`
- `.llm/history/active/metaboost-alpha-login-500-fix/metaboost-alpha-login-500-fix-part-01.md`

### Session 2 - 2026-05-02

#### Prompt (Developer)

add the more durable fixes. make sure podverse and metaboost have it if they could benefit from it

#### Key Decisions

- Add startup migration-readiness init containers in API deployments so API pods do not
  start serving before app DB migrations are visible.
- For Metaboost, gate on `linear_migration_history` containing
  `0003_terms_default_seed.sql` to guarantee the terms-seed fix is applied before API
  startup.
- For Podverse, gate on `linear_migration_history` table existence and non-empty history to
  avoid API startup during fresh DB bootstrap/migration windows.

#### Files Modified

- `infra/k8s/base/api/deployment.yaml`
- `.llm/history/active/metaboost-alpha-login-500-fix/metaboost-alpha-login-500-fix-part-01.md`

### Session 3 - 2026-05-02

#### Prompt (Developer)

if you didn't already you should add corresponding changes to management for podverse and
metaboost and k.podcastdj.com and metaboost.cc if they are relevant so that migrations are
handling properly for both api and mgmt api. if you already did this or don't think the work
applies to mgmt, then do nothing

#### Key Decisions

- Added `wait-management-migrations` init container to
  `infra/k8s/base/management-api/deployment.yaml` in Metaboost to block management-api startup
  until management DB migration history is present.
- Used read-only management DB credentials (`DB_MANAGEMENT_READ_*`) and
  `linear_migration_history` table/row checks as the readiness condition.
- Determined `metaboost.cc` is not relevant in this workspace because no k8s manifests are
  present there.

#### Files Modified

- `infra/k8s/base/management-api/deployment.yaml`
- `.llm/history/active/metaboost-alpha-login-500-fix/metaboost-alpha-login-500-fix-part-01.md`
