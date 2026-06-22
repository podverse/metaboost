# Copy-paste prompts - Metaboost staged-changes cleanup

Use these prompts to execute plans in the order defined by
[`00-EXECUTION-ORDER.md`](./00-EXECUTION-ORDER.md). Phases are sequential.

Paths below are relative to the **Metaboost** repository root.

After completing a step, update this file to mark the step completed (per
**plan-execution-completion-tracking**) and move completed numbered plans to
`.llm/plans/completed/metaboost-staged-changes-cleanup/` when appropriate.

---

## Phase 1 - Cross-app error boundaries -> @metaboost/ui

### Step 1 - `01-error-boundaries-shared-ui`

**Status:** completed (plan moved to `.llm/plans/completed/metaboost-staged-changes-cleanup/01-error-boundaries-shared-ui.md`).

```text
Implement plan file `.llm/plans/active/metaboost-staged-changes-cleanup/01-error-boundaries-shared-ui.md` exactly as written.
Move the duplicated error.tsx and global-error.tsx logic into shared @metaboost/ui components with SCSS modules and Storybook stories per the plan.
Apps must end up with thin client wrappers that pass translations and the cookie name.
Do not modify unrelated files.
When done, summarize changed files and any follow-up risks.
```

---

## Phase 2 - Notification dispatch performance

### Step 2 - `02-notification-dispatch-perf`

**Status:** completed (plan moved to `.llm/plans/completed/metaboost-staged-changes-cleanup/02-notification-dispatch-perf.md`).

```text
Implement plan file `.llm/plans/active/metaboost-staged-changes-cleanup/02-notification-dispatch-perf.md` exactly as written.
Add UserWebPushSubscriptionService.listByUserIds, switch the webpush channel to a single batched query and Promise.allSettled, and add BucketNotificationPreferenceService.upsertManyForUser using INSERT ... SELECT ... ON CONFLICT.
Update notification-webpush.test.ts with the multi-subscriber and applyToDescendants-many-descendants cases per the plan.
Do not modify unrelated files.
When done, summarize changed files and any follow-up risks.
```

---

## Phase 3 - Shared API contract types

### Step 3 - `03-shared-api-contract-types`

**Status:** completed (plan moved to `.llm/plans/completed/metaboost-staged-changes-cleanup/03-shared-api-contract-types.md`).

```text
Implement plan file `.llm/plans/active/metaboost-staged-changes-cleanup/03-shared-api-contract-types.md` exactly as written.
Make @metaboost/helpers-requests the canonical home for the four duplicated request/response types and have apps/api/src/schemas re-export from there.
Annotate subscriptionToJson with WebPushSubscriptionDto.
Do not modify unrelated files or the Joi schemas' runtime shape.
When done, summarize changed files and any follow-up risks.
```

---

## Phase 4 - Schema dedup + pg/web-push helpers

### Step 4 - `04-schema-and-error-helpers`

**Status:** completed (plan moved to `.llm/plans/completed/metaboost-staged-changes-cleanup/04-schema-and-error-helpers.md`).

```text
Implement plan file `.llm/plans/active/metaboost-staged-changes-cleanup/04-schema-and-error-helpers.md` exactly as written.
Extract WebPushSubscriptionKeys in OpenAPI, webPushKeysObject in Joi, isPgUniqueViolation/getPgErrorCode in @metaboost/orm, and getWebPushErrorStatusCode next to the channel.
Replace inline guards in bucketsController and BucketService.create.
Do not modify unrelated files.
When done, summarize changed files and any follow-up risks.
```

Phase 3 and Phase 4 are file-disjoint; if running with two agents, they may
proceed in parallel after Phase 2 lands.

---

## Phase 5 - Helpers + bell refactor + single-query upsert

### Step 5 - `05-helpers-and-bell-refactor`

**Status:** completed (plan moved to `.llm/plans/completed/metaboost-staged-changes-cleanup/05-helpers-and-bell-refactor.md`).

```text
Implement plan file `.llm/plans/active/metaboost-staged-changes-cleanup/05-helpers-and-bell-refactor.md` exactly as written.
Add requireUser, cookieHeaderToHeaders, withServerCookie helpers; rewrite the two new ORM upserts as INSERT ... ON CONFLICT ... RETURNING; split BucketNotificationsBell into useBucketWebPushSubscription + useApplyToDescendantsModal + presentational.
Update existing tests as the plan describes.
Do not modify unrelated files.
When done, summarize changed files and any follow-up risks.
```

---

## Phase 6 - Style + import hygiene

### Step 6 - `06-style-and-import-hygiene`

**Status:** completed (plan moved to `.llm/plans/completed/metaboost-staged-changes-cleanup/06-style-and-import-hygiene.md`).

```text
Implement plan file `.llm/plans/active/metaboost-staged-changes-cleanup/06-style-and-import-hygiene.md` exactly as written.
Replace inline styles on the bucket detail page with an SCSS module (or a small shared component if the pattern repeats), switch web-push to named imports, replace console.error with the standard logger, and update the test mock accordingly.
Do not modify unrelated files.
When done, summarize changed files and any follow-up risks.
```
