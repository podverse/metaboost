# metaboost-staged-changes-cleanup

**Started:** 2026-05-07
**Author:** Agent
**Context:** Plan files for cleaning up DRY violations and inefficiencies introduced by
the bucket-webpush-foundation changeset and adjacent additions in the staged Metaboost
diff. Six dependency-ordered phases saved under
`.llm/plans/active/metaboost-staged-changes-cleanup/`.

### Session 1 - 2026-05-07

#### Prompt (Developer)

thoroughly investigate all of the staged changes for metaboost, and determine if there
are any inefficiencies or lack of DRY practices you think should be cleaned up.

#### Prompt (Developer)

create and save plan files for the work locally

#### Key Decisions

- Treated the deliverable as plan-file authoring per `plan-files-convention`; no product
  code or tests changed in this session.
- Six phases ordered so cross-app error-boundary extraction (largest DRY win) and
  notification-dispatch performance fixes ship first; type/schema dedup and bell refactor
  follow once shared types are in place; style/import hygiene runs last.
- Error boundaries to be moved to `@metaboost/ui` (per `reusable-components` /
  `ui-component-promotion`), not an internal shared module.
- Auth narrowing handled via a `requireUser(req, res)` helper rather than a typed
  `AuthenticatedRequest` to keep the change local.
- Push send fan-out uses `Promise.allSettled` so one bad endpoint does not abort the
  batch; descendant preference write is collapsed to a single `INSERT ... SELECT ...
  ON CONFLICT` mirroring `BucketService.applyGeneralSettingsToDescendants`.
- Postgres unique-violation detection centralized in `@metaboost/orm` via
  `isPgUniqueViolation`, removing two `as { code: string }` assertions flagged by
  `avoid-type-assertions`.
- Pre-existing duplication outside the bucket-webpush changeset (e.g. the broader
  cookie-header pattern across all of `helpers-requests/web/buckets.ts`) is out of scope
  beyond replacing the call sites already touched.

#### Files Created/Modified

- .llm/plans/active/metaboost-staged-changes-cleanup/00-SUMMARY.md
- .llm/plans/active/metaboost-staged-changes-cleanup/00-EXECUTION-ORDER.md
- .llm/plans/active/metaboost-staged-changes-cleanup/01-error-boundaries-shared-ui.md
- .llm/plans/active/metaboost-staged-changes-cleanup/02-notification-dispatch-perf.md
- .llm/plans/active/metaboost-staged-changes-cleanup/03-shared-api-contract-types.md
- .llm/plans/active/metaboost-staged-changes-cleanup/04-schema-and-error-helpers.md
- .llm/plans/active/metaboost-staged-changes-cleanup/05-helpers-and-bell-refactor.md
- .llm/plans/active/metaboost-staged-changes-cleanup/06-style-and-import-hygiene.md
- .llm/plans/active/metaboost-staged-changes-cleanup/COPY-PASTA.md
- .llm/history/active/metaboost-staged-changes-cleanup/metaboost-staged-changes-cleanup-part-01.md

### Session 2 - 2026-05-07

#### Prompt (Developer)

@metaboost/.llm/plans/active/metaboost-staged-changes-cleanup/COPY-PASTA.md:21-25

#### Key Decisions

- Completed plan `01-error-boundaries-shared-ui`: thin `error.tsx` / `global-error.tsx` in web and management-web using `AppErrorBoundary`, `GlobalErrorBoundary`, and `extractErrorsStringsFromMessagesDefault` from `@metaboost/ui`.
- Vitest + Testing Library + jsdom + `@vitejs/plugin-react` added to `packages/ui`; root `test:unit` runs `@metaboost/ui` tests.
- Plan file moved to `.llm/plans/completed/metaboost-staged-changes-cleanup/`.

#### Files Created/Modified

- packages/ui/package.json, vitest.config.ts
- packages/ui/src/components/feedback/AppErrorBoundary/AppErrorBoundary.test.tsx
- apps/web/src/app/error.tsx, apps/web/src/app/global-error.tsx
- apps/management-web/src/app/error.tsx, apps/management-web/src/app/global-error.tsx
- packages/ui/PACKAGES-UI.md
- package.json (test:unit)
- .llm/plans/active/metaboost-staged-changes-cleanup/COPY-PASTA.md
- .llm/plans/completed/metaboost-staged-changes-cleanup/01-error-boundaries-shared-ui.md (moved from active)
- .llm/plans/active/metaboost-staged-changes-cleanup/00-EXECUTION-ORDER.md
- packages/ui/src/components/feedback/GlobalErrorBoundary/GlobalErrorBoundary.tsx (import order)

### Session 3 - 2026-05-07

#### Prompt (Developer)

@metaboost/.llm/plans/active/metaboost-staged-changes-cleanup/COPY-PASTA.md:37-41

#### Key Decisions

- Implemented `02-notification-dispatch-perf`: `UserWebPushSubscriptionService.listByUserIds`, batched `Promise.allSettled` web-push dispatch with inline status extraction + Phase 4 TODO, `BucketNotificationPreferenceService.upsertManyForUser` (INSERT…SELECT…ON CONFLICT), controller uses bulk upsert for descendants; extended `notification-webpush.test.ts` with five-descendant bulk spy and multi-subscriber `listByUserIds` spy cases.

#### Files Created/Modified

- packages/orm/src/services/UserWebPushSubscriptionService.ts
- packages/orm/src/services/BucketNotificationPreferenceService.ts
- apps/api/src/lib/notifications/webPushChannel.ts
- apps/api/src/controllers/bucketsController.ts
- apps/api/src/test/notification-webpush.test.ts
- .llm/plans/active/metaboost-staged-changes-cleanup/COPY-PASTA.md
- .llm/plans/active/metaboost-staged-changes-cleanup/00-EXECUTION-ORDER.md
- .llm/plans/completed/metaboost-staged-changes-cleanup/02-notification-dispatch-perf.md (moved from active)

### Session 4 - 2026-05-07

#### Prompt (Developer)

@metaboost/.llm/plans/active/metaboost-staged-changes-cleanup/COPY-PASTA.md:53-57

#### Key Decisions

- Completed plan `03-shared-api-contract-types`: canonical types in `@metaboost/helpers-requests` (`WebPushSubscriptionKeys`, PATCH response `BucketNotificationPreferencePatchResponse`), package barrel exports, API schemas re-export only, `subscriptionToJson` returns `WebPushSubscriptionDto`, bucket notification handlers use typed payloads.

#### Files Created/Modified

- packages/helpers-requests/src/web/auth.ts
- packages/helpers-requests/src/web/buckets.ts
- packages/helpers-requests/src/index.ts
- apps/api/src/schemas/webPushSubscriptions.ts
- apps/api/src/schemas/buckets.ts
- apps/api/src/controllers/webPushSubscriptionsController.ts
- apps/api/src/controllers/bucketsController.ts
- .llm/plans/active/metaboost-staged-changes-cleanup/COPY-PASTA.md
- .llm/plans/active/metaboost-staged-changes-cleanup/00-EXECUTION-ORDER.md
- .llm/plans/completed/metaboost-staged-changes-cleanup/03-shared-api-contract-types.md (moved from active)

### Session 5 - 2026-05-07

#### Prompt (Developer)

@metaboost/.llm/plans/active/metaboost-staged-changes-cleanup/COPY-PASTA.md:69-77

#### Key Decisions

- Completed plan `04-schema-and-error-helpers`: OpenAPI `WebPushSubscriptionKeys` + `$ref`; Joi `webPushKeysObject`; `packages/orm/src/lib/pgError.ts` with `getPgErrorCode` / `isPgUniqueViolation`; Vitest unit tests and `**/*.test.ts` excluded from orm tsc; `getWebPushErrorStatusCode` in `webPushChannel.ts`; `bucketsController` and `BucketService.create` use `isPgUniqueViolation`.

#### Files Created/Modified

- packages/orm/src/lib/pgError.ts, pgError.test.ts, vitest.config.ts
- packages/orm/package.json, tsconfig.json
- packages/orm/src/index.ts
- packages/orm/src/services/BucketService.ts
- apps/api/src/openapi.ts
- apps/api/src/schemas/webPushSubscriptions.ts
- apps/api/src/lib/notifications/webPushChannel.ts
- apps/api/src/controllers/bucketsController.ts
- .llm/plans/active/metaboost-staged-changes-cleanup/COPY-PASTA.md
- .llm/plans/active/metaboost-staged-changes-cleanup/00-EXECUTION-ORDER.md
- .llm/plans/completed/metaboost-staged-changes-cleanup/04-schema-and-error-helpers.md (moved from active)

### Session 6 - 2026-05-07

#### Prompt (Developer)

@metaboost/.llm/plans/active/metaboost-staged-changes-cleanup/COPY-PASTA.md:88-92

#### Key Decisions

- Implemented plan `05-helpers-and-bell-refactor`: `requireUser` in `apps/api/src/middleware/auth.ts`; `cookieHeaderToHeaders` in `helpers-requests` + 11 call sites in `web/buckets.ts`; `withServerCookie` in `apps/web/src/lib/server-request.ts` and refactored server `fetch*` helpers that used the cookie/baseUrl preamble with `webBuckets.*`; raw SQL `INSERT … ON CONFLICT … RETURNING` for `UserWebPushSubscriptionService.upsert` and `BucketNotificationPreferenceService.upsert` with row mappers (explicit bypass comment); split bell into `useBucketWebPushSubscription.ts`, `useApplyToDescendantsModal.tsx`, and thin `BucketNotificationsBell.tsx`.
- Express 5 `req.params` typing requires `typeof subscriptionIdParam !== 'string'` guards before ORM calls (replaces prior empty-string checks only).
- Vitest added to `@metaboost/helpers-requests` with `request.cookieHeaderToHeaders.test.ts`; root `test:unit` runs that workspace; API `require-user.test.ts` added.
- `notification-webpush` integration test narrows subscription id without type assertions and asserts DB row `id`/`endpoint` after upsert.

#### Files Created/Modified

- apps/api/src/middleware/auth.ts
- apps/api/src/controllers/webPushSubscriptionsController.ts
- apps/api/src/controllers/bucketsController.ts
- apps/api/src/test/require-user.test.ts
- apps/api/src/test/notification-webpush.test.ts
- packages/helpers-requests/src/request.ts
- packages/helpers-requests/src/web/buckets.ts
- packages/helpers-requests/src/index.ts
- packages/helpers-requests/src/request.cookieHeaderToHeaders.test.ts
- packages/helpers-requests/vitest.config.ts
- packages/helpers-requests/package.json
- packages/orm/src/services/UserWebPushSubscriptionService.ts
- packages/orm/src/services/BucketNotificationPreferenceService.ts
- apps/web/src/lib/server-request.ts
- apps/web/src/lib/buckets.ts
- apps/web/src/components/useApplyToDescendantsModal.tsx
- apps/web/src/app/(main)/bucket/[id]/useBucketWebPushSubscription.ts
- apps/web/src/app/(main)/bucket/[id]/BucketNotificationsBell.tsx
- package.json (root test:unit)
- package-lock.json
- .llm/plans/active/metaboost-staged-changes-cleanup/COPY-PASTA.md
- .llm/plans/active/metaboost-staged-changes-cleanup/00-EXECUTION-ORDER.md
- .llm/plans/completed/metaboost-staged-changes-cleanup/05-helpers-and-bell-refactor.md (moved from active)

### Session 7 - 2026-05-07

#### Prompt (Developer)

@metaboost/.llm/plans/active/metaboost-staged-changes-cleanup/COPY-PASTA.md:104-107

#### Key Decisions

- Completed plan `06-style-and-import-hygiene`: bucket detail title uses co-located `BucketName.module.scss` with `@metaboost/ui` spacing tokens (no shared `BucketNameWithVisibility` — pattern only on detail page); verified `@metaboost/ui` feedback error boundaries have no inline styles; `webPushChannel` uses named `web-push` imports and `logger.error` via new `apps/api/src/lib/logger.ts`; integration test mock uses named exports and `vi.mocked(sendNotification)`.
- Entire plan set finalized per tracking rules: moved `06-style-and-import-hygiene.md`, `COPY-PASTA.md`, `00-EXECUTION-ORDER.md`, and `00-SUMMARY.md` into `.llm/plans/completed/metaboost-staged-changes-cleanup/` with execution-order links rewritten as same-directory `./NN-*.md`.

#### Files Created/Modified

- apps/web/src/app/(main)/bucket/[id]/BucketName.module.scss
- apps/web/src/app/(main)/bucket/[id]/page.tsx
- apps/api/src/lib/logger.ts
- apps/api/src/lib/notifications/webPushChannel.ts
- apps/api/src/test/notification-webpush.test.ts
- .llm/plans/completed/metaboost-staged-changes-cleanup/06-style-and-import-hygiene.md (from active)
- .llm/plans/completed/metaboost-staged-changes-cleanup/COPY-PASTA.md (from active)
- .llm/plans/completed/metaboost-staged-changes-cleanup/00-EXECUTION-ORDER.md (from active)
- .llm/plans/completed/metaboost-staged-changes-cleanup/00-SUMMARY.md (from active)

### Session 8 - 2026-05-07

#### Prompt (Developer)

Briefly inform the user about the task result and perform any follow-up actions (if needed).

#### Key Decisions

- Summarized background shell tasks (Podverse + Metaboost): successes vs failures from terminal logs.
- Metaboost `@metaboost/ui` ESLint failure was `perfectionist/sort-imports` on `GlobalErrorBoundary.tsx`; ran `eslint --fix` on that file — canonical order is `ThemeWrapper` (`../../../contexts`) then `../../form` / `../../layout` imports; full `npm run lint -w @metaboost/ui` now passes.

#### Files Created/Modified

- packages/ui/src/components/feedback/GlobalErrorBoundary/GlobalErrorBoundary.tsx
- .llm/history/active/metaboost-staged-changes-cleanup/metaboost-staged-changes-cleanup-part-01.md
