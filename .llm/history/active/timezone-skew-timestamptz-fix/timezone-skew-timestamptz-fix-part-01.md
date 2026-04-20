### Session 1 - 2026-04-18

#### Prompt (Developer)

Fix Timezone Skew Across Metaboost

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Switched canonical DB timestamp domain definitions to `TIMESTAMPTZ` in both app and management schema fragments for clean-slate correctness.
- Added an explicit forward migration script for existing databases that converts all `server_time_with_default` consumer columns with `AT TIME ZONE 'UTC'` semantics and recreates the domain as `TIMESTAMPTZ`.
- Updated summary range behavior so `all-time` no longer applies a `to=now` cutoff, preventing false exclusions.
- Standardized summary series bucketing to UTC truncation (`setUTC*`) so grouping is stable regardless of server locale/timezone.
- Changed custom summary date-range serialization to use local-day boundaries converted to UTC ISO, avoiding forced `...Z` midnight semantics.
- Added regression tests for timezone-offset summary/list parity in API and added an end-to-end web spec/helper for bucket summary parity after mb-v1 ingest.

#### Files Modified

- infra/k8s/base/db/postgres-init/0003_app_schema.sql
- infra/k8s/base/db/postgres-init/0005_management_schema.sql.frag
- scripts/database/migrate-server-time-to-timestamptz.sh
- apps/api/src/controllers/bucketMessagesController.ts
- apps/web/src/lib/summaryDateRange.ts
- apps/web/src/components/BucketSummaryPanel.tsx
- apps/web/src/app/(main)/dashboard/page.tsx
- apps/api/src/test/bucket-summary.test.ts
- apps/web/e2e/helpers/postMbV1Boost.ts
- apps/web/e2e/bucket-summary-timezone-parity.spec.ts

### Session 2 - 2026-04-18

#### Prompt (Developer)

@metaboost/scripts/database/migrate-server-time-to-timestamptz.sh:1-94 i don't want to have a migration process. just remove alter table and use the create table to do it right the first init

#### Key Decisions

- Removed the standalone migration script to align with the clean-slate-only schema policy.
- Kept timezone correctness in canonical init schema definitions (`server_time_with_default` as `TIMESTAMPTZ`) without any forward `ALTER TABLE` migration path.

#### Files Modified

- scripts/database/migrate-server-time-to-timestamptz.sh

### Session 3 - 2026-04-18

#### Prompt (Developer)

@metaboost/apps/web/src/lib/summaryDateRange.ts:1-31 if any aspects of this file would make sense to put in a shared helpers package, do so

#### Key Decisions

- Moved date-input validation and local-date-to-UTC conversion utilities from web-local code into `@metaboost/helpers` so the logic can be reused across packages.
- Replaced web imports to consume shared helpers exports and removed the now-redundant local file.
- Reused the shared date-input validator inside bucket summary preference parsing to avoid duplicate regex logic.

#### Files Modified

- packages/helpers/src/time/dateInput.ts
- packages/helpers/src/index.ts
- apps/web/src/components/BucketSummaryPanel.tsx
- apps/web/src/app/(main)/dashboard/page.tsx
- apps/web/src/lib/bucketSummaryPrefs.ts
- apps/web/src/lib/summaryDateRange.ts

### Session 4 - 2026-04-18

#### Prompt (Developer)

instead of putting amount and messages on two lines, they should be on the same line with a vertical divider between them in the summary

#### Key Decisions

- Updated the `BucketSummary` data-view metrics layout to render `Amount` and `Messages` on one row.
- Added a visual vertical divider between the two metric values and kept responsive wrapping behavior for narrow widths.

#### Files Modified

- packages/ui/src/components/bucket/BucketSummary/BucketSummary.tsx
- packages/ui/src/components/bucket/BucketSummary/BucketSummary.module.scss
