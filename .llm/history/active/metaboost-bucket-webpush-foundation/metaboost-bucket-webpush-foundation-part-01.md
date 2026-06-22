# metaboost-bucket-webpush-foundation

**Started:** 2026-05-06
**Author:** LLM session
**Context:** Plan-set execution prompts.

### Session 1 - 2026-05-06

#### Prompt (Developer)

make sure a copy pasta for the @metaboost/.llm/plans/active/metaboost-bucket-webpush-foundation/ plans is created

#### Key Decisions

- Added [`COPY-PASTA.md`](.llm/plans/active/metaboost-bucket-webpush-foundation/COPY-PASTA.md) with five sequential copy-paste prompts mapped to `01`–`05` plan files and assumptions between steps.
- Linked execution order doc to COPY-PASTA for discovery.

#### Files Created/Modified

- [.llm/plans/active/metaboost-bucket-webpush-foundation/COPY-PASTA.md](.llm/plans/active/metaboost-bucket-webpush-foundation/COPY-PASTA.md)
- [.llm/plans/active/metaboost-bucket-webpush-foundation/00-EXECUTION-ORDER.md](.llm/plans/active/metaboost-bucket-webpush-foundation/00-EXECUTION-ORDER.md)

### Session 2 - 2026-05-06

#### Prompt (Developer)

Implement plan file `.llm/plans/active/metaboost-bucket-webpush-foundation/01-backend-domain-and-schema.md` exactly as written.
Follow Metaboost linear migrations and ORM conventions (forward-only SQL under infra/k8s, ops kustomization bundle sync if adding migration files).
Do not modify unrelated files.
When done, summarize changed files and any follow-up risks.

#### Key Decisions

- Added `bucket_notification_preference` and `user_web_push_subscription` to canonical `0001_app_schema.sql` (ops + `infra/k8s/base/db/source/app` copy), with triggers and indexes.
- Implemented `BucketNotificationPreferenceService` and `UserWebPushSubscriptionService` with upsert/list/delete; Web Push upsert keys on unique `endpoint`.
- Child bucket creation copies parent `bucket_notification_preference` rows in `BucketService.create` after settings insert.
- Regenerated `0003a`/`0003b` linear baseline archives after migration change.
- Moved completed plan `01-backend-domain-and-schema.md` to `.llm/plans/completed/metaboost-bucket-webpush-foundation/`.

#### Files Created/Modified

- `infra/k8s/base/ops/source/database/linear-migrations/app/0001_app_schema.sql`
- `infra/k8s/base/db/source/app/0001_app_schema.sql`
- `infra/k8s/base/db/source/bootstrap/0003a_app_linear_baseline.sql.gz`
- `infra/k8s/base/db/source/bootstrap/0003b_management_linear_baseline.sql.gz`
- `packages/orm/src/entities/BucketNotificationPreference.ts`
- `packages/orm/src/entities/UserWebPushSubscription.ts`
- `packages/orm/src/services/BucketNotificationPreferenceService.ts`
- `packages/orm/src/services/UserWebPushSubscriptionService.ts`
- `packages/orm/src/data-source.ts`
- `packages/orm/src/index.ts`
- `packages/orm/src/services/BucketService.ts`
- `.llm/plans/active/metaboost-bucket-webpush-foundation/COPY-PASTA.md`
- `.llm/plans/active/metaboost-bucket-webpush-foundation/00-EXECUTION-ORDER.md`
- `.llm/plans/completed/metaboost-bucket-webpush-foundation/01-backend-domain-and-schema.md` (moved from active)

### Session 3 - 2026-05-06

#### Prompt (Developer)

Implement plan file `.llm/plans/active/metaboost-bucket-webpush-foundation/02-api-and-webpush-channel.md` exactly as written.
Assume step 1 (01-backend-domain-and-schema) is complete.
Include Joi schemas, helpers-requests types, non-blocking dispatch on message persistence, and threshold-aware gating per the plan.
Do not modify unrelated files.
When done, summarize changed files and any follow-up risks.

#### Key Decisions

- Added authenticated bucket notification preference GET/PATCH with `applyToDescendants`; auth-scoped Web Push subscription CRUD under `/auth/web-push-subscriptions`.
- Implemented `notifyNewBucketMessage` + `webPushChannel` (VAPID optional via `API_WEB_PUSH_VAPID_*`); non-blocking `void` dispatch after boost persistence in `persistStandardBoostMessage`.
- Threshold gate reuses `resolveEffectiveThresholdFilter` via new `boostMessageMeetsRootPublicMinimumThreshold` (boost rows only).
- OpenAPI, Joi (`schemas/buckets`, `schemas/webPushSubscriptions`), and `helpers-requests` updated for new contracts.
- Added `web-push` dependency to `@metaboost/api`; ORM `findByUserAndBucket`, `updateForUser` for API handlers.

#### Files Created/Modified

- `apps/api/package.json` (web-push)
- `apps/api/src/config/index.ts`
- `apps/api/src/lib/message-threshold-filter.ts`
- `apps/api/src/lib/notifications/notifyNewBucketMessage.ts`
- `apps/api/src/lib/notifications/webPushChannel.ts`
- `apps/api/src/lib/standardIngest/persistBoostMessage.ts`
- `apps/api/src/controllers/bucketsController.ts`
- `apps/api/src/controllers/webPushSubscriptionsController.ts`
- `apps/api/src/routes/auth.ts`
- `apps/api/src/routes/buckets.ts`
- `apps/api/src/schemas/buckets.ts`
- `apps/api/src/schemas/webPushSubscriptions.ts`
- `apps/api/src/openapi.ts`
- `packages/orm/src/services/BucketNotificationPreferenceService.ts`
- `packages/orm/src/services/UserWebPushSubscriptionService.ts`
- `packages/helpers-requests/src/web/auth.ts`
- `packages/helpers-requests/src/web/buckets.ts`
- `.llm/plans/active/metaboost-bucket-webpush-foundation/COPY-PASTA.md`
- `.llm/plans/active/metaboost-bucket-webpush-foundation/00-EXECUTION-ORDER.md`
- `.llm/plans/completed/metaboost-bucket-webpush-foundation/02-api-and-webpush-channel.md` (moved from active)

### Session 4 - 2026-05-06

#### Prompt (Developer)

Implement plan file `.llm/plans/active/metaboost-bucket-webpush-foundation/03-web-ui-and-service-worker.md` exactly as written.
Assume steps 1–2 are complete so APIs and contracts exist.
Reuse existing bucket scope-modal patterns where the plan says to align UX.
Do not modify unrelated files.
When done, summarize changed files and any follow-up risks.

#### Key Decisions

- Added `BucketNotificationsBell` with enable/disable flows (permission, SW subscribe, upsert subscription API, PATCH preference) and disable (unsubscribe, delete server sub, PATCH preference).
- Scope modal reuses `applySettingsScope*` strings when `hasChildBuckets`; tabs + bell in `Row wrap` via optional `notificationBell` on `BucketDetailTabShell`.
- Fixed bell relative imports to `../../../../config` and `../../../../lib/webPushBrowser`.
- Documented optional `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY` in web sidecar `.env.example`; i18n keys under `buckets.*`.
- Moved completed plan `03-web-ui-and-service-worker.md` to `.llm/plans/completed/metaboost-bucket-webpush-foundation/`.

#### Files Created/Modified

- `apps/web/src/app/(main)/bucket/[id]/BucketNotificationsBell.tsx`
- `apps/web/src/app/(main)/bucket/[id]/BucketDetailTabShell.tsx`
- `apps/web/src/app/(main)/bucket/[id]/page.tsx`
- `apps/web/i18n/originals/en-US.json`
- `apps/web/i18n/originals/es.json`
- `apps/web/i18n/overrides/es.json`
- `apps/web/sidecar/.env.example`
- `apps/web/src/lib/webPushBrowser.ts` (import path: remove `.js` for Turbopack)
- `.llm/plans/active/metaboost-bucket-webpush-foundation/COPY-PASTA.md`
- `.llm/plans/active/metaboost-bucket-webpush-foundation/00-EXECUTION-ORDER.md`
- `.llm/plans/completed/metaboost-bucket-webpush-foundation/03-web-ui-and-service-worker.md` (moved from active)

### Session 5 - 2026-05-06

#### Prompt (Developer)

Implement plan file `.llm/plans/active/metaboost-bucket-webpush-foundation/04-env-vapid-and-local-setup.md` exactly as written.
Assume steps 1–3 are complete so required env keys and runtime surfaces are known from implemented code.
Keep canonical `.env.example`, sidecar, and local env override flows aligned per Metaboost env conventions.
Do not modify unrelated files.
When done, summarize changed files and any follow-up risks.

#### Key Decisions

- Canonical API env: **`WEBPUSH_ENABLED`**, **`WEBPUSH_VAPID_*`**, subject via **`WEBPUSH_VAPID_SUBJECT`**; legacy **`API_WEB_PUSH_VAPID_*`** still supported in `config.webPushVapid`.
- Web runtime: **`NEXT_PUBLIC_WEBPUSH_VAPID_PUBLIC_KEY`**, **`NEXT_PUBLIC_WEBPUSH_ENABLED`** (+ legacy **`NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY`**); sidecar forwards optional keys; **`getWebPushClientEnabled`** gates bucket bell.
- **`notifications.env`** home override + **`setup.sh`** apply/sync to API and web/sidecar (public key mirror).
- **`npm run webpush:generate-vapid-keys -w @metaboost/api`** and **`scripts/development/generate-webpush-vapid-keys.sh`**; docs **`docs/development/env/WEB-PUSH-LOCAL.md`**.
- Moved completed plan `04-env-vapid-and-local-setup.md` to `.llm/plans/completed/metaboost-bucket-webpush-foundation/`.

#### Files Created/Modified

- `apps/api/src/config/index.ts`
- `apps/api/.env.example`
- `apps/api/package.json`
- `apps/web/src/config/runtime-config.ts`
- `apps/web/src/config/env.ts`
- `apps/web/src/app/(main)/bucket/[id]/page.tsx`
- `apps/web/sidecar/src/server.ts`
- `apps/web/sidecar/.env.example`
- `infra/config/env-templates/api.env.example`
- `infra/config/env-templates/web-sidecar.env.example`
- `scripts/local-env/setup.sh`
- `scripts/env-overrides/home-override-env-files.inc.sh`
- `scripts/env-overrides/write-home-override-stubs.rb`
- `scripts/development/generate-webpush-vapid-keys.sh`
- `docs/development/env/LOCAL-ENV-OVERRIDES.md`
- `docs/development/env/WEB-PUSH-LOCAL.md`
- `AGENTS.md`
- `.llm/plans/active/metaboost-bucket-webpush-foundation/COPY-PASTA.md`
- `.llm/plans/active/metaboost-bucket-webpush-foundation/00-EXECUTION-ORDER.md`
- `.llm/plans/completed/metaboost-bucket-webpush-foundation/04-env-vapid-and-local-setup.md` (moved from active)

### Session 6 - 2026-05-06

#### Prompt (Developer)

Implement plan file `.llm/plans/active/metaboost-bucket-webpush-foundation/05-tests-and-verification.md` exactly as written.
Assume steps 1–4 are complete.
Add or update API integration tests and web E2E tests per the plan; do not skip threshold/dispatch or inheritance cases listed there.
Do not modify unrelated files.
When done, summarize changed files, verification commands run (or to run locally), and any follow-up risks.

#### Key Decisions

- Added `apps/api/src/test/notification-webpush.test.ts`: mocked `web-push`, preference GET/PATCH (solo + apply descendants), inheritance via `BucketService` mb-mid + RSS item, subscription CRUD, `notifyNewBucketMessage` dispatch vs threshold floor.
- Wired stable E2E VAPID keys for API + web/sidecar in `apps/web/playwright.e2e-server-env.ts`; seeded child bucket `e2ebkt000003` under Bucket One for scope-modal flows (`tools/web/seed-e2e.mjs`).
- New Playwright spec `apps/web/e2e/bucket-notifications-webpush-bucket-owner.spec.ts` (bell visibility, API reload parity, no-modal toggle, modal buttons, descendant pref after apply-all).
- Moved `05-tests-and-verification.md` to `.llm/plans/completed/metaboost-bucket-webpush-foundation/`; marked Step 5 complete in COPY-PASTA and execution-order link; moved `COPY-PASTA.md` and `00-EXECUTION-ORDER.md` from `active/` to the same completed plan-set directory; fixed same-directory links in `00-EXECUTION-ORDER.md`.

#### Files Created/Modified

- `apps/api/src/test/notification-webpush.test.ts`
- `apps/web/playwright.e2e-server-env.ts`
- `apps/web/e2e/bucket-notifications-webpush-bucket-owner.spec.ts`
- `tools/web/seed-e2e.mjs`
- `makefiles/local/e2e-spec-order-web.txt`
- `.llm/plans/completed/metaboost-bucket-webpush-foundation/COPY-PASTA.md` (moved from active)
- `.llm/plans/completed/metaboost-bucket-webpush-foundation/00-EXECUTION-ORDER.md` (moved from active)
- `.llm/plans/completed/metaboost-bucket-webpush-foundation/05-tests-and-verification.md` (moved from active)
