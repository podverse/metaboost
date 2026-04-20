### Session 1 - 2026-04-20

#### Prompt (Developer)

Terms Grace Architecture Plan

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Created a dedicated plan set under `.llm/plans/active/terms-grace-clean-slate/` using the repo convention (`00-EXECUTION-ORDER`, `00-SUMMARY`, numbered phase files, and `COPY-PASTA`).
- Structured implementation as five sequential phases to keep dependencies explicit: schema/ORM, policy/auth API, web gating UX, standard endpoint enforcement, and contracts/tests/seeds.
- Included DB-native clean-slate guidance in plan files (versioned terms + versioned acceptance) and phase-aware behavior (`announcement`, `grace`, `enforced`) across auth and ingest.
- Added copy-pasta prompts that reference each numbered phase file for controlled execution.

#### Files Modified

- .llm/history/active/terms-grace-clean-slate/terms-grace-clean-slate-part-01.md
- .llm/plans/active/terms-grace-clean-slate/00-EXECUTION-ORDER.md
- .llm/plans/active/terms-grace-clean-slate/00-SUMMARY.md
- .llm/plans/active/terms-grace-clean-slate/01-schema-and-orm.md
- .llm/plans/active/terms-grace-clean-slate/02-policy-evaluator-and-auth-api.md
- .llm/plans/active/terms-grace-clean-slate/03-web-gating-and-ux.md
- .llm/plans/active/terms-grace-clean-slate/04-standard-endpoint-enforcement.md
- .llm/plans/active/terms-grace-clean-slate/05-openapi-tests-and-seeds.md
- .llm/plans/active/terms-grace-clean-slate/COPY-PASTA.md

### Session 2 - 2026-04-20

#### Prompt (Developer)

update the plan files. i don't think we care to return info like "owner has accepted latest
terms" or "terms effective at" the URL to the terms should itself serve as the authority of the
terms in effect for that bucket, and if a bucket is not valid due to the terms not being
accepted, the bucket should simply return an error message during the get check that explains the
blocker and post message should similarly return such an error message

#### Key Decisions

- Updated the clean-slate plan set to avoid returning owner terms metadata fields (for example
  `owner_has_accepted_latest_terms` or effective-date values) in bucket success responses.
- Clarified that `terms_of_service_url` is the authority for the terms in effect for a bucket.
- Specified that bucket GET check and POST ingest should return explicit blocker errors when terms
  acceptance is missing, instead of exposing policy-state fields in successful payloads.

#### Files Modified

- .llm/history/active/terms-grace-clean-slate/terms-grace-clean-slate-part-01.md
- .llm/plans/active/terms-grace-clean-slate/00-SUMMARY.md
- .llm/plans/active/terms-grace-clean-slate/02-policy-evaluator-and-auth-api.md
- .llm/plans/active/terms-grace-clean-slate/04-standard-endpoint-enforcement.md
- .llm/plans/active/terms-grace-clean-slate/05-openapi-tests-and-seeds.md

### Session 3 - 2026-04-20

#### Prompt (Developer)

@metaboost/.llm/plans/active/terms-grace-clean-slate/COPY-PASTA.md:7-8 

as you finish these copy pasta steps you should mark them as completed, and you should also move the plan files to completed as they are completed

#### Key Decisions

- Executed all six copy-pasta phases sequentially, and after each phase moved the phase file from
  `.llm/plans/active/terms-grace-clean-slate/` to `.llm/plans/completed/terms-grace-clean-slate/`
  while marking completion in `COPY-PASTA.md`.
- Introduced DB-native terms versioning with `terms_version` + version-linked
  `user_terms_acceptance`, plus compatibility helpers in ORM services so legacy effective-date calls
  still work during transition.
- Added a shared API terms policy evaluator and moved auth + standard endpoint enforcement to
  policy-driven `mustAcceptNow`, with deterministic terms-blocked `403` responses using code
  `owner_terms_not_accepted_current`.
- Extended auth payload shape with policy fields (`currentTermsVersionKey`, `termsPolicyPhase`,
  `acceptedCurrentTerms`, `mustAcceptTermsNow`, `termsBlockerMessage`,
  `termsEnforcementStartsAt`) and propagated parsing/gating changes through web middleware/context.
- Internationalized the full shared terms content and phase messaging, keeping a single canonical
  terms component for `/terms` and `/terms-required`.
- Wired `LEGAL_NAME` through classification, env merge/setup sync, web sidecar runtime config, web
  env accessors, and terms rendering with safe i18n fallback.
- Added a dedicated operator runbook for terms lifecycle and rollback under
  `docs/development/TERMS-LIFECYCLE-RUNBOOK.md`.

#### Files Modified

- .llm/history/active/terms-grace-clean-slate/terms-grace-clean-slate-part-01.md
- .llm/plans/completed/terms-grace-clean-slate/00-EXECUTION-ORDER.md
- .llm/plans/completed/terms-grace-clean-slate/00-SUMMARY.md
- .llm/plans/completed/terms-grace-clean-slate/01-schema-and-orm.md
- .llm/plans/completed/terms-grace-clean-slate/02-policy-evaluator-and-auth-api.md
- .llm/plans/completed/terms-grace-clean-slate/03-web-gating-and-ux.md
- .llm/plans/completed/terms-grace-clean-slate/04-standard-endpoint-enforcement.md
- .llm/plans/completed/terms-grace-clean-slate/05-openapi-tests-and-seeds.md
- .llm/plans/completed/terms-grace-clean-slate/06-operations-and-legal-name-i18n.md
- .llm/plans/completed/terms-grace-clean-slate/COPY-PASTA.md
- apps/api/src/controllers/authController.ts
- apps/api/src/controllers/mbV1Controller.ts
- apps/api/src/controllers/mbrssV1Controller.ts
- apps/api/src/lib/terms-policy/index.ts
- apps/api/src/lib/userToJson.ts
- apps/api/src/openapi.ts
- apps/api/src/openapi-mbV1.ts
- apps/api/src/openapi-mbrssV1.ts
- apps/api/src/test/auth.test.ts
- apps/api/src/test/helpers/setup.ts
- apps/api/src/test/mb-v1-spec-contract.test.ts
- apps/api/src/test/mbrss-v1-spec-contract.test.ts
- apps/web/src/app/(auth)/signup/page.tsx
- apps/web/src/app/(main)/settings/SettingsPageContent.tsx
- apps/web/src/app/(main)/terms/page.tsx
- apps/web/src/app/(main)/terms-required/TermsRequiredPageClient.tsx
- apps/web/src/app/(main)/terms-required/page.tsx
- apps/web/src/components/TermsOfServiceContent.tsx
- apps/web/src/config/env.ts
- apps/web/src/config/runtime-config-store.ts
- apps/web/src/config/runtime-config.ts
- apps/web/src/context/AuthContext.tsx
- apps/web/src/lib/server-auth.ts
- apps/web/src/proxy.ts
- apps/web/sidecar/src/server.ts
- apps/web/i18n/originals/en-US.json
- apps/web/i18n/originals/es.json
- apps/web/i18n/overrides/es.json
- docs/development/ENV-REFERENCE.md
- docs/development/LOCAL-ENV-OVERRIDES.md
- docs/development/TERMS-LIFECYCLE-RUNBOOK.md
- infra/env/classification/base.yaml
- infra/k8s/base/db/postgres-init/0003_app_schema.sql
- packages/orm/src/data-source.ts
- packages/orm/src/entities/TermsVersion.ts
- packages/orm/src/entities/User.ts
- packages/orm/src/entities/UserTermsAcceptance.ts
- packages/orm/src/index.ts
- packages/orm/src/services/TermsVersionService.ts
- packages/orm/src/services/UserTermsAcceptanceService.ts
- scripts/env-classification/lib/metaboost_env_merge.rb
- scripts/local-env/setup.sh
- tools/web/seed-e2e.mjs
