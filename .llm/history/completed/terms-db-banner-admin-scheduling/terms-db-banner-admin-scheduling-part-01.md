### Session 1 - 2026-04-21

#### Prompt (Developer)

@metaboost/.llm/plans/completed/terms-db-banner-admin-scheduling/COPY-PASTA.md:9

#### Key Decisions

- Executed only Phase 1 / Step 1 data-model scope from the plan: schema, bootstrap data, ORM entity/service, and startup/seed alignment.
- Adopted hard-break terms lifecycle statuses in model and schema: `draft`, `upcoming`, `current`, `deprecated`.
- Added DB-backed terms content at schema/entity level (later superseded by joined locale columns; see Session 6).
- Schema and indexes live in the normal Postgres init / combined migration path only (no standalone terms SQL script in `scripts/database/`).

#### Files Created/Modified

- packages/orm/src/entities/TermsVersion.ts
- packages/orm/src/services/TermsVersionService.ts
- infra/k8s/base/db/postgres-init/0003_app_schema.sql
- apps/api/src/controllers/authController.ts
- apps/api/src/lib/startup/validateTermsVersionReady.ts
- apps/api/src/test/helpers/setup.ts
- .llm/history/active/terms-db-banner-admin-scheduling/terms-db-banner-admin-scheduling-part-01.md

### Session 5 - 2026-04-21

#### Prompt (Developer)

@metaboost/.llm/plans/completed/terms-db-banner-admin-scheduling/COPY-PASTA.md:29-30

#### Key Decisions

- Implemented only Phase 3 testing/rollout scope by rewriting the runbook from legacy lifecycle terms to the hard-break lifecycle (`draft/upcoming/current/deprecated`).
- Documented DB-backed terms content ownership, super-admin management-web workflow, release rollout order, emergency SQL fallback, rollback strategy, and production smoke checklist.
- Tightened API integration coverage in `auth.test.ts` to assert acceptance-target outputs for both current-only and upcoming-required policy states.
- Kept verification as command handoff only (no tests executed in-agent per repo rule).

#### Files Created/Modified

- docs/development/TERMS-LIFECYCLE-RUNBOOK.md
- apps/api/src/test/auth.test.ts
- .llm/history/active/terms-db-banner-admin-scheduling/terms-db-banner-admin-scheduling-part-01.md

### Session 2 - 2026-04-21

#### Prompt (Developer)

@metaboost/.llm/plans/completed/terms-db-banner-admin-scheduling/COPY-PASTA.md:13

#### Key Decisions

- Implemented Step 2 with hard-break terminology only: `current/upcoming/deprecated` (no legacy fallback paths).
- Updated auth policy evaluation and `/auth/me` payload to expose current/upcoming/accepted terms snapshots and upcoming-acceptance banner signals.
- Updated `/auth/terms-acceptance` to record acceptance for the actionable target (upcoming when present, otherwise current).
- Added management-api super-admin endpoints for terms-version lifecycle operations (list/get/create/update/promote-to-current) with single-upcoming guard and transactional promote behavior.
- Synced OpenAPI and request helper types/functions for the new contracts, and added integration tests for API pre-accept and management-api lifecycle constraints.

#### Files Created/Modified

- apps/api/src/lib/terms-policy/index.ts
- apps/api/src/lib/userToJson.ts
- apps/api/src/controllers/authController.ts
- apps/api/src/openapi.ts
- apps/api/src/test/auth.test.ts
- apps/management-api/src/app.ts
- apps/management-api/src/openapi.ts
- apps/management-api/src/controllers/termsVersionsController.ts
- apps/management-api/src/routes/termsVersions.ts
- apps/management-api/src/schemas/termsVersions.ts
- apps/management-api/src/test/management-terms-versions.test.ts
- packages/helpers-requests/src/types/auth-types.ts
- packages/helpers-requests/src/types/index.ts
- packages/helpers-requests/src/types/management-terms-types.ts
- packages/helpers-requests/src/management-web/termsVersions.ts
- packages/helpers-requests/src/index.ts
- .llm/history/active/terms-db-banner-admin-scheduling/terms-db-banner-admin-scheduling-part-01.md

### Session 3 - 2026-04-21

#### Prompt (Developer)

@metaboost/.llm/plans/completed/terms-db-banner-admin-scheduling/COPY-PASTA.md:19-20

#### Key Decisions

- Implemented only Phase 2 Agent A web scope: persistent terms reminder banner, DB-backed `/terms` rendering, and terms-required page content sourced from auth payload snapshots.
- Upgraded web auth payload parsing and AuthContext user shape to require/support new terms fields (`currentTerms`, `upcomingTerms`, `acceptedTerms`, upcoming acceptance flags/deadline).
- Kept `/terms` accessible for signed-out users with a login prompt; for signed-in users it now renders accepted/current plus upcoming terms states and hides deprecated terms content.
- Removed old i18n-driven terms content component references from web page flows and deleted the unused `TermsOfServiceContent` component.

#### Files Created/Modified

- apps/web/src/lib/auth-user.ts
- apps/web/src/context/AuthContext.tsx
- apps/web/src/components/TermsVersionCard.tsx
- apps/web/src/components/TermsVersionCard.module.scss
- apps/web/src/components/TermsReminderBanner.tsx
- apps/web/src/components/TermsReminderBanner.module.scss
- apps/web/src/app/(main)/layout.tsx
- apps/web/src/app/(main)/terms/page.tsx
- apps/web/src/app/(main)/terms-required/TermsRequiredPageClient.tsx
- apps/web/src/app/(auth)/signup/page.tsx
- apps/web/src/app/(main)/settings/SettingsPageContent.tsx
- apps/web/src/components/TermsOfServiceContent.tsx (deleted)
- apps/web/e2e/terms-unauthenticated.spec.ts
- apps/web/e2e/terms-required-users.spec.ts
- .llm/history/active/terms-db-banner-admin-scheduling/terms-db-banner-admin-scheduling-part-01.md

### Session 4 - 2026-04-21

#### Prompt (Developer)

@metaboost/.llm/plans/completed/terms-db-banner-admin-scheduling/COPY-PASTA.md:23-24

#### Key Decisions

- Implemented only the Phase 2 Agent B management-web scope from the plan line reference: super-admin-only terms lifecycle UI for list/view/new/edit plus status transition actions.
- Added management-web route/nav wiring for `terms-versions` and `terms-version/:id` paths, with visibility and access restricted to super admins.
- Built management-web forms and actions around the management-api lifecycle rules (`draft/upcoming` editable, single upcoming guard, promote-upcoming-to-current, old current auto-deprecates).
- Added management-web E2E coverage for the super-admin happy path and guardrails (single-upcoming block + promote flow), plus forbidden and unauthenticated route access.
- Updated helper request signatures for management-web terms endpoints to support cookie-auth usage (optional token), matching existing helper patterns.

#### Files Created/Modified

- packages/helpers-requests/src/management-web/termsVersions.ts
- apps/management-web/src/lib/routes.ts
- apps/management-web/src/lib/main-nav.ts
- apps/management-web/src/components/TermsVersionsTableWithFilter.tsx
- apps/management-web/src/components/terms-versions/TermsVersionForm.tsx
- apps/management-web/src/components/terms-versions/TermsVersionActions.tsx
- apps/management-web/src/app/(main)/terms-versions/page.tsx
- apps/management-web/src/app/(main)/terms-versions/new/page.tsx
- apps/management-web/src/app/(main)/terms-version/[id]/page.tsx
- apps/management-web/src/app/(main)/terms-version/[id]/edit/page.tsx
- apps/management-web/i18n/originals/en-US.json
- apps/management-web/i18n/originals/es.json
- apps/management-web/e2e/terms-versions-super-admin-full-crud.spec.ts
- apps/management-web/e2e/terms-versions-admin-with-buckets-read-no-admins-crud.spec.ts
- apps/management-web/e2e/terms-versions-unauthenticated.spec.ts
- .llm/history/active/terms-db-banner-admin-scheduling/terms-db-banner-admin-scheduling-part-01.md

### Session 6 - 2026-04-21

#### Prompt (User)

Requested follow-up changes to terms lifecycle implementation:
- render `terms_version` content with line breaks and bold section-header syntax in UI;
- move content into joined locale columns (`en-US`, `es`) with startup defaults;
- bootstrap initial terms rows in app startup instead of SQL inserts.

#### Key Decisions

- Replaced `terms_version.content_text` with joined `terms_version_content` (1:1) containing `content_text_en_us` and `content_text_es`.
- Added startup bootstrap in `TermsVersionService.assertConfiguredForStartup()` to auto-create the first default current terms row (plus localized content) when `terms_version` is empty.
- Kept auth payload contract as `contentText` per snapshot, but localized on API response using `Accept-Language` (`es` uses Spanish, fallback `en-US`), including SSR forwarding from web server helpers.
- Updated management-api and management-web contracts/forms to edit both locale fields and added explicit editor guidance for supported formatting syntax (`**Header**` and blank-line paragraph breaks).
- Updated web and management-web rendering to apply lightweight bold-marker parsing and newline-preserving output for terms content.

#### Files Created/Modified

- packages/orm/src/entities/TermsVersion.ts
- packages/orm/src/defaults/termsDefaultContent.ts
- packages/orm/src/services/TermsVersionService.ts
- packages/orm/src/services/UserTermsAcceptanceService.ts
- packages/orm/src/data-source.ts
- packages/orm/src/index.ts
- infra/k8s/base/db/postgres-init/0003_app_schema.sql
- apps/api/src/lib/startup/validateTermsVersionReady.ts
- apps/management-api/src/index.ts
- apps/api/src/lib/terms-policy/index.ts
- apps/api/src/controllers/authController.ts
- apps/api/src/test/helpers/setup.ts
- apps/api/src/test/auth.test.ts
- apps/management-api/src/schemas/termsVersions.ts
- apps/management-api/src/controllers/termsVersionsController.ts
- apps/management-api/src/test/helpers/setup.ts
- apps/management-api/src/test/management-terms-versions.test.ts
- apps/management-api/src/openapi.ts
- packages/helpers-requests/src/types/management-terms-types.ts
- apps/management-web/src/components/terms-versions/TermsVersionForm.tsx
- apps/management-web/src/components/terms-versions/TermsContentRichText.tsx
- apps/management-web/src/app/(main)/terms-version/[id]/page.tsx
- apps/management-web/i18n/originals/en-US.json
- apps/management-web/i18n/originals/es.json
- apps/management-web/e2e/terms-versions-super-admin-full-crud.spec.ts
- apps/web/src/lib/server-auth.ts
- apps/web/src/components/TermsVersionCard.tsx
- apps/web/src/components/TermsVersionCard.module.scss
- docs/development/TERMS-LIFECYCLE-RUNBOOK.md
- .llm/history/active/terms-db-banner-admin-scheduling/terms-db-banner-admin-scheduling-part-01.md

### Session 7 - 2026-04-21

#### Prompt (User)

Requested removal of standalone `scripts/database/terms-hard-break-status-migration.sql`; terms DDL should live only in the usual Postgres init / combined migration flow.

#### Key Decisions

- Deleted `scripts/database/terms-hard-break-status-migration.sql` entirely; no external one-off terms migration script.
- Canonical schema remains in `infra/k8s/base/db/postgres-init/` (regenerated via `scripts/database/combine-migrations.sh`); first-row bootstrap remains in app startup when `terms_version` is empty.
- Updated `TERMS-LIFECYCLE-RUNBOOK.md` rollout section to describe only the normal schema path plus startup seeding.

#### Files Created/Modified

- docs/development/TERMS-LIFECYCLE-RUNBOOK.md
- .llm/history/active/terms-db-banner-admin-scheduling/terms-db-banner-admin-scheduling-part-01.md
- scripts/database/terms-hard-break-status-migration.sql (deleted)

### Session 8 - 2026-04-21

#### Prompt (User)

Remove `infra/k8s/base/db/postgres-init/0007_default_terms_version.sql` if unused; terms defaults come from app startup.

#### Key Decisions

- Deleted placeholder `0007_default_terms_version.sql` (comments-only; superseded by app-side bootstrap).
- Dropped file from K8s ConfigMap generators (`base/db`, `base/stack`), Docker Compose postgres mounts, and `verify-migrations-combined.sh` (now expects `0008_seed_local_user.sql` in canonical tree for local parity).
- Refreshed `INFRA-K8S.md`, `INFRA-DOCKER-LOCAL.md`, and `0008_seed_local_user.sql` header comment to describe init order and terms startup behavior.

#### Files Created/Modified

- infra/k8s/base/db/postgres-init/0007_default_terms_version.sql (deleted)
- infra/k8s/base/db/kustomization.yaml
- infra/k8s/base/stack/kustomization.yaml
- infra/docker/local/docker-compose.yml
- scripts/database/verify-migrations-combined.sh
- infra/k8s/INFRA-K8S.md
- infra/docker/local/INFRA-DOCKER-LOCAL.md
- infra/k8s/base/db/postgres-init/0008_seed_local_user.sql
- .llm/history/active/terms-db-banner-admin-scheduling/terms-db-banner-admin-scheduling-part-01.md

### Session 9 - 2026-04-21

#### Prompt (User)

Archive the `terms-db-banner-admin-scheduling` plan set to `completed/` after confirming COPY-PASTA phases 01–05 are done.

#### Key Decisions

- Moved entire plan directory from `.llm/plans/active/terms-db-banner-admin-scheduling` to `.llm/plans/completed/terms-db-banner-admin-scheduling`.
- Moved feature history directory to `.llm/history/completed/terms-db-banner-admin-scheduling` and updated in-file cross-references to `plans/completed/...` and `history/completed/...`.

#### Files Created/Modified

- .llm/plans/completed/terms-db-banner-admin-scheduling/ (moved from active)
- .llm/history/completed/terms-db-banner-admin-scheduling/ (moved from active)
- .llm/history/completed/terms-db-banner-admin-scheduling/terms-db-banner-admin-scheduling-part-01.md
