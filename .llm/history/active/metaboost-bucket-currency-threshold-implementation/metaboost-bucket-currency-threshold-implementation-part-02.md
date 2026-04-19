# Metaboost Bucket Currency Threshold - Implementation History (Part 02)

### Session 11 - 2026-04-19

#### Prompt (Developer)

add the generic shared helper

#### Key Decisions

- Added a new shared numeric guard helper `isNonNegativeInteger` to `@metaboost/helpers` and exported it from the package root for reuse across API and tooling code.
- Replaced repeated ad-hoc non-negative integer checks with the shared helper in API conversion/filter code, management-api query parsing, and generate-data contract assertions.
- Refactored API bucket conversion query parsing to use shared query-string coercion plus the new integer helper for consistency.

#### Files Modified

- packages/helpers/src/number/isNonNegativeInteger.ts
- packages/helpers/src/index.ts
- apps/api/src/lib/parseNonNegativeIntegerQueryParam.ts
- apps/api/src/lib/message-threshold-filter.ts
- apps/api/src/lib/exchangeRates.ts
- apps/api/src/controllers/bucketMessagesController.ts
- apps/management-api/src/controllers/bucketMessagesController.ts
- tools/generate-data/src/contracts.ts
- .llm/history/active/metaboost-bucket-currency-threshold-implementation/metaboost-bucket-currency-threshold-implementation-part-02.md

### Session 12 - 2026-04-19

#### Prompt (Developer)

Threshold Filter Hardening Plan

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Added two new hardening plan files to the active plan set:
  - `09-threshold-filter-sql-path-and-query-rename.md`
  - `10-legacy-row-behavior-and-contract-clarity.md`
- Updated plan sequencing so hardening steps run immediately after step 04 and before downstream web/docs/test phases.
- Updated copy-pasta prompts to make step 09 the next actionable step and to reflect renamed phase/step ordering.
- Expanded the test plan to explicitly cover `minimumAmountMinor`, removal of `minimumAmountUsdCents`, SQL-backed threshold behavior, and legacy/non-convertible row exclusion behavior when threshold is active.

#### Files Modified

- .llm/plans/active/metaboost-bucket-currency-threshold/09-threshold-filter-sql-path-and-query-rename.md
- .llm/plans/active/metaboost-bucket-currency-threshold/10-legacy-row-behavior-and-contract-clarity.md
- .llm/plans/active/metaboost-bucket-currency-threshold/00-EXECUTION-ORDER.md
- .llm/plans/active/metaboost-bucket-currency-threshold/00-SUMMARY.md
- .llm/plans/active/metaboost-bucket-currency-threshold/COPY-PASTA.md
- .llm/plans/active/metaboost-bucket-currency-threshold/08-test-plan.md
- .llm/history/active/metaboost-bucket-currency-threshold-implementation/metaboost-bucket-currency-threshold-implementation-part-02.md

### Session 13 - 2026-04-19

#### Prompt (Developer)

@metaboost/.llm/plans/active/metaboost-bucket-currency-threshold/COPY-PASTA.md:44-47

#### Key Decisions

- Reworked threshold filtering to a SQL-backed path by converting the effective bucket/query threshold once per request to persisted USD snapshot cents and applying `minimumUsdCents` in `BucketMessageService` list/count queries.
- Renamed runtime threshold query handling to `minimumAmountMinor` and removed runtime handling of `minimumAmountUsdCents` from API and management-api controllers.
- Updated shared request helper builders to support `minimumAmountMinor` query serialization for bucket and public message list/read helpers.
- Updated integration tests to use the renamed parameter and added assertions that legacy `minimumAmountUsdCents` is no longer interpreted as an active threshold override.
- Marked copy-pasta step 5 as completed, promoted step 6 to next, and moved plan `09` from active to completed.

#### Files Modified

- apps/api/src/lib/message-threshold-filter.ts
- apps/api/src/controllers/bucketMessagesController.ts
- apps/management-api/src/controllers/bucketMessagesController.ts
- packages/orm/src/entities/BucketMessage.ts
- packages/orm/src/services/BucketMessageService.ts
- packages/helpers-requests/src/web/buckets.ts
- packages/helpers-requests/src/management-web/bucketMessages.ts
- apps/api/src/test/buckets.test.ts
- apps/api/src/test/mb-v1-spec-contract.test.ts
- apps/api/src/test/mbrss-v1-spec-contract.test.ts
- apps/management-api/src/test/management-buckets-messages.test.ts
- .llm/plans/active/metaboost-bucket-currency-threshold/COPY-PASTA.md
- .llm/plans/completed/metaboost-bucket-currency-threshold/09-threshold-filter-sql-path-and-query-rename.md
- .llm/history/active/metaboost-bucket-currency-threshold-implementation/metaboost-bucket-currency-threshold-implementation-part-02.md

### Session 14 - 2026-04-19

#### Prompt (Developer)

Threshold Hard-Break Correction

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Replaced USD-special threshold snapshot columns with root-preferred-currency snapshot columns (`threshold_currency_at_create`, `threshold_amount_minor_at_create`) and switched SQL threshold filtering to these fields.
- Updated ingest to compute and persist threshold snapshots in the root bucket preferred currency at create time, and removed silent fallback behavior for missing conversion.
- Enforced a query hard-break for threshold filtering: `minimumAmountMinor` is canonical and `minimumAmountUsdCents` now returns `400` on list/read endpoints.
- Added root preferred-currency change recomputation before bucket update success in both API and management-api controllers.
- Aligned OpenAPI, docs, and integration tests to preferred-currency minor-unit semantics and strict `minimumAmountMinor` contract.

#### Files Modified

- infra/k8s/base/db/postgres-init/0003_app_schema.sql
- packages/orm/src/entities/BucketMessageValue.ts
- packages/orm/src/entities/BucketMessage.ts
- packages/orm/src/services/BucketMessageService.ts
- packages/orm/src/services/BucketService.ts
- apps/api/src/lib/message-threshold-filter.ts
- apps/api/src/lib/standardIngest/persistBoostMessage.ts
- apps/api/src/lib/recompute-threshold-snapshots.ts
- apps/api/src/controllers/bucketsController.ts
- apps/api/src/controllers/bucketMessagesController.ts
- apps/api/src/controllers/mbV1Controller.ts
- apps/api/src/controllers/mbrssV1Controller.ts
- apps/management-api/src/lib/exchangeRates.ts
- apps/management-api/src/lib/recompute-threshold-snapshots.ts
- apps/management-api/src/controllers/bucketsController.ts
- apps/management-api/src/controllers/bucketMessagesController.ts
- apps/api/src/openapi-mbV1.ts
- apps/api/src/openapi-mbrssV1.ts
- apps/management-api/src/openapi.ts
- docs/MB-V1-SPEC-CONTRACT.md
- docs/MBRSS-V1-SPEC-CONTRACT.md
- docs/api/STANDARD-ENDPOINT-INTEGRATION-GUIDE.md
- docs/buckets/WEB-BUCKET-ADMIN-ROLE-INHERITANCE.md
- apps/api/src/test/buckets.test.ts
- apps/api/src/test/mb-v1-spec-contract.test.ts
- apps/api/src/test/mbrss-v1-spec-contract.test.ts
- apps/management-api/src/test/management-buckets-messages.test.ts
- apps/web/i18n/originals/en-US.json
- apps/management-web/i18n/originals/en-US.json

### Session 15 - 2026-04-19

#### Prompt (Developer)

@metaboost/apps/management-api/src/lib/recompute-threshold-snapshots.ts:5 i think this constant should be defined in a more general package and imported wherever this constant is used

#### Key Decisions

- Replaced local `INT32_MAX` usage with shared `MAX_MINIMUM_MESSAGE_AMOUNT_MINOR` from `@metaboost/helpers`.
- Applied the same shared constant to all newly added threshold snapshot conversion paths to keep bounds consistent.

#### Files Modified

- apps/management-api/src/lib/recompute-threshold-snapshots.ts
- apps/api/src/lib/recompute-threshold-snapshots.ts
- apps/api/src/lib/standardIngest/persistBoostMessage.ts
- .llm/history/active/metaboost-bucket-currency-threshold-implementation/metaboost-bucket-currency-threshold-implementation-part-02.md

### Session 16 - 2026-04-19

#### Prompt (Developer)

hasDeprecatedMinimumAmountUsdCentsQuery since i asked for a hard break, i don't want any references to deprecated or legacy related to this feature work. we want to forget the usd-centric way was the previous implementation

#### Key Decisions

- Renamed the helper to neutral hard-break language (`hasDisallowedThresholdQueryParams`) to remove deprecated/legacy wording.
- Updated threshold query rejection error messages to avoid USD-specific or deprecated framing while preserving strict hard-break behavior.

#### Files Modified

- apps/api/src/lib/message-threshold-filter.ts
- apps/api/src/controllers/bucketMessagesController.ts
- apps/api/src/controllers/mbV1Controller.ts
- apps/api/src/controllers/mbrssV1Controller.ts
- apps/management-api/src/controllers/bucketMessagesController.ts
- .llm/history/active/metaboost-bucket-currency-threshold-implementation/metaboost-bucket-currency-threshold-implementation-part-02.md

### Session 17 - 2026-04-19

#### Prompt (Developer)

@metaboost/.llm/plans/active/metaboost-bucket-currency-threshold/COPY-PASTA.md:52-55

#### Key Decisions

- Completed Step 6 scope by explicitly documenting threshold behavior for rows missing usable snapshot values under active thresholds.
- Added consumer-facing migration notes clarifying `minimumAmountMinor`, create-time threshold snapshot basis, and strict `amount_unit` requirements.
- Aligned management-api OpenAPI message endpoints so list/get docs both expose `minimumAmountMinor` semantics.
- Marked Step 6 as completed in `COPY-PASTA.md`.

#### Files Modified

- docs/MB-V1-SPEC-CONTRACT.md
- docs/MBRSS-V1-SPEC-CONTRACT.md
- docs/api/STANDARD-ENDPOINT-INTEGRATION-GUIDE.md
- apps/management-api/src/openapi.ts
- .llm/plans/active/metaboost-bucket-currency-threshold/COPY-PASTA.md
- .llm/history/active/metaboost-bucket-currency-threshold-implementation/metaboost-bucket-currency-threshold-implementation-part-02.md

### Session 18 - 2026-04-19

#### Prompt (Developer)

COPY-PASTA.md now marks Step 6 complete, but the step file itself is still under active; if you want strict plan hygiene, next action is moving 10-...md to completed.
apps/web and apps/management-web still use i18n keys containing minimumMessageUsdCents in key names (labels/help text are updated), which is cosmetic debt if you want fully neutral naming everywhere.

fix these

#### Key Decisions

- Moved Step 6 plan file from `active` to `completed` and updated `COPY-PASTA.md` to reference the completed-path plan file.
- Renamed remaining web and management-web i18n threshold keys from `minimumMessageUsdCents*` to `minimumMessageAmountMinor*` for neutral naming consistency.
- Updated Spanish source strings for threshold label/help text to remove USD-specific wording and align with preferred-currency minor-unit semantics.

#### Files Modified

- .llm/plans/active/metaboost-bucket-currency-threshold/COPY-PASTA.md
- .llm/plans/completed/metaboost-bucket-currency-threshold/10-legacy-row-behavior-and-contract-clarity.md
- .llm/plans/active/metaboost-bucket-currency-threshold/10-legacy-row-behavior-and-contract-clarity.md (deleted)
- apps/web/src/app/(main)/buckets/BucketForm.tsx
- apps/web/i18n/originals/en-US.json
- apps/web/i18n/originals/es.json
- apps/web/i18n/overrides/es.json
- apps/management-web/src/components/buckets/BucketForm.tsx
- apps/management-web/i18n/originals/en-US.json
- apps/management-web/i18n/originals/es.json
- apps/management-web/i18n/overrides/es.json
- .llm/history/active/metaboost-bucket-currency-threshold-implementation/metaboost-bucket-currency-threshold-implementation-part-02.md
