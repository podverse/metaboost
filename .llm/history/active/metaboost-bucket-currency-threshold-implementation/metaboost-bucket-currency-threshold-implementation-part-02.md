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

### Session 19 - 2026-04-19

#### Prompt (Developer)

@metaboost/.llm/plans/active/metaboost-bucket-currency-threshold/COPY-PASTA.md:62-64

#### Key Decisions

- Implemented Step 7a with a new public web route (`/exchange-rates`) that provides a direct-linkable calculator and conversion table using cached rates.
- Added a public API endpoint (`GET /buckets/public/exchange-rates`) that validates strict denomination inputs and returns conversions across currently cached supported currencies plus freshness metadata.
- Added app-level `req...` wrapper (`apps/web/src/lib/exchangeRates.ts`) built on `@metaboost/helpers-requests/request()` so web code follows helper-request patterns without raw `fetch`.
- Marked Step 7a completed in `COPY-PASTA.md` and moved `05-metaboost-web-exchange-rates-page.md` from active to completed for plan hygiene.

#### Files Modified

- apps/api/src/controllers/bucketMessagesController.ts
- apps/api/src/routes/buckets.ts
- packages/helpers-requests/src/types/bucket-types.ts
- packages/helpers-requests/src/types/index.ts
- packages/helpers-requests/src/index.ts
- packages/helpers-requests/src/web/exchangeRates.ts
- apps/web/src/lib/routes.ts
- apps/web/src/lib/exchangeRates.ts
- apps/web/src/app/(main)/exchange-rates/page.tsx
- apps/web/src/app/(main)/exchange-rates/ExchangeRatesPageClient.tsx
- apps/web/i18n/originals/en-US.json
- apps/web/i18n/originals/es.json
- apps/web/i18n/overrides/es.json
- .llm/plans/active/metaboost-bucket-currency-threshold/COPY-PASTA.md
- .llm/plans/completed/metaboost-bucket-currency-threshold/05-metaboost-web-exchange-rates-page.md
- .llm/plans/active/metaboost-bucket-currency-threshold/05-metaboost-web-exchange-rates-page.md (deleted)
- .llm/history/active/metaboost-bucket-currency-threshold-implementation/metaboost-bucket-currency-threshold-implementation-part-02.md

### Session 20 - 2026-04-19

#### Prompt (Developer)

do it

#### Key Decisions

- Split non-message responsibilities out of `bucketMessagesController` to improve controller boundaries without changing endpoint behavior.
- Moved public bucket metadata handling into a dedicated `publicBucketsController`.
- Moved exchange-rate and conversion endpoints into a dedicated `exchangeRatesController`.
- Kept `bucketMessagesController` focused on message list/read/delete and summary/public-message concerns for now.

#### Files Modified

- apps/api/src/controllers/publicBucketsController.ts
- apps/api/src/controllers/exchangeRatesController.ts
- apps/api/src/controllers/bucketMessagesController.ts
- apps/api/src/routes/buckets.ts
- .llm/history/active/metaboost-bucket-currency-threshold-implementation/metaboost-bucket-currency-threshold-implementation-part-02.md

### Session 21 - 2026-04-19

#### Prompt (Developer)

Query Helper Centralization Plan

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Centralized generic query parsing helpers in `@metaboost/helpers` (`query/`), rather than introducing a new package.
- Replaced duplicated controller-local parsing logic in `apps/api` and `apps/management-api` with shared helper imports while preserving route-level error responses.
- Removed obsolete API-local query parser (`apps/api/src/lib/parseNonNegativeIntegerQueryParam.ts`) after migrating call sites.

#### Files Modified

- packages/helpers/src/query/parseNonNegativeIntegerQueryParam.ts
- packages/helpers/src/query/parseRequiredQueryStringParam.ts
- packages/helpers/src/query/parseRequiredNonNegativeIntegerQueryParam.ts
- packages/helpers/src/index.ts
- apps/api/src/lib/message-threshold-filter.ts
- apps/management-api/src/controllers/bucketMessagesController.ts
- apps/api/src/controllers/exchangeRatesController.ts
- apps/api/src/lib/parseNonNegativeIntegerQueryParam.ts (deleted)
- .llm/history/active/metaboost-bucket-currency-threshold-implementation/metaboost-bucket-currency-threshold-implementation-part-02.md

### Session 22 - 2026-04-19

#### Prompt (Developer)

@metaboost/apps/api/src/routes/buckets.ts:39 it seems like this route should be moved somewhere else IF the exchange rate endpoint results do not even touch bucket or bucket information directly

#### Key Decisions

- Moved the non-bucket exchange-rates listing endpoint off the buckets router to a dedicated top-level `exchange-rates` router.
- Kept bucket-scoped conversion (`/buckets/public/:id/conversion`) in the buckets router because it depends on bucket context and preferred currency.
- Updated web and helpers-request clients to call `/exchange-rates` instead of `/buckets/public/exchange-rates`.

#### Files Modified

- apps/api/src/routes/exchangeRates.ts
- apps/api/src/app.ts
- apps/api/src/routes/buckets.ts
- apps/web/src/lib/exchangeRates.ts
- packages/helpers-requests/src/web/exchangeRates.ts
- .llm/history/active/metaboost-bucket-currency-threshold-implementation/metaboost-bucket-currency-threshold-implementation-part-02.md

### Session 23 - 2026-04-19

#### Prompt (Developer)

@metaboost/.llm/plans/active/metaboost-bucket-currency-threshold/COPY-PASTA.md:124-127

#### Key Decisions

- Marked Step 7e as completed in `COPY-PASTA.md` after implementing validation/i18n hardening in Podverse.
- Updated execution-order tracking to reference the completed location for plan `13`.
- Moved plan file `13-podverse-boost-form-currency-input-validation-and-e2e.md` from active to completed to keep plan hygiene consistent with prior steps.

#### Files Modified

- .llm/plans/active/metaboost-bucket-currency-threshold/COPY-PASTA.md
- .llm/plans/active/metaboost-bucket-currency-threshold/00-EXECUTION-ORDER.md
- .llm/plans/completed/metaboost-bucket-currency-threshold/13-podverse-boost-form-currency-input-validation-and-e2e.md
- .llm/plans/active/metaboost-bucket-currency-threshold/13-podverse-boost-form-currency-input-validation-and-e2e.md (deleted)
- .llm/history/active/metaboost-bucket-currency-threshold-implementation/metaboost-bucket-currency-threshold-implementation-part-02.md

### Session 24 - 2026-04-19

#### Prompt (Developer)

@metaboost/.llm/plans/active/metaboost-bucket-currency-threshold/COPY-PASTA.md:134-137

#### Key Decisions

- Started Step 8 execution (`07-openapi-docs-env-and-k8s.md`) to finalize strict denomination and configuration contract documentation.
- Updated OpenAPI contracts to document strict `amount_unit` requirements using supported currency/unit enums, added capability threshold/conversion metadata, and documented public conversion/exchange-rate endpoints in the main API spec.
- Extended mb-v1 and mbrss-v1 capability responses to include `preferred_currency`, `minimum_message_amount_minor`, and public `conversion_endpoint_url` for public buckets.
- Added missing exchange-rate env contract variables to classification and remote-k8s overlays (`API_EXCHANGE_RATES_MAX_STALE_MS`, `API_EXCHANGE_RATES_SERVER_STANDARD_CURRENCY`), and wired them into base k8s API workload env.
- Added startup validation for optional server standard currency (must be supported) and optional max stale TTL (positive integer).
- Updated developer-facing docs to explicitly cover strict denomination behavior and conversion endpoint usage.
- Marked Step 8 completed in `COPY-PASTA.md`, updated execution order, and moved plan `07-openapi-docs-env-and-k8s.md` from active to completed.

#### Files Modified

- .llm/history/active/metaboost-bucket-currency-threshold-implementation/metaboost-bucket-currency-threshold-implementation-part-02.md
- apps/api/src/openapi-mbV1.ts
- apps/api/src/openapi-mbrssV1.ts
- apps/api/src/openapi.ts
- apps/api/src/controllers/mbV1Controller.ts
- apps/api/src/controllers/mbrssV1Controller.ts
- apps/api/src/lib/startup/validation.ts
- apps/management-api/src/openapi.ts
- infra/env/classification/base.yaml
- infra/env/overrides/remote-k8s.yaml
- infra/k8s/base/stack/workloads.yaml
- docs/development/ENV-REFERENCE.md
- docs/api/STANDARD-ENDPOINT-INTEGRATION-GUIDE.md
- docs/MB-V1-SPEC-CONTRACT.md
- docs/MBRSS-V1-SPEC-CONTRACT.md
- .llm/plans/active/metaboost-bucket-currency-threshold/COPY-PASTA.md
- .llm/plans/active/metaboost-bucket-currency-threshold/00-EXECUTION-ORDER.md
- .llm/plans/completed/metaboost-bucket-currency-threshold/07-openapi-docs-env-and-k8s.md
- .llm/plans/active/metaboost-bucket-currency-threshold/07-openapi-docs-env-and-k8s.md (deleted)

### Session 25 - 2026-04-19

#### Prompt (Developer)

@metaboost/.llm/plans/active/metaboost-bucket-currency-threshold/COPY-PASTA.md:142-147

#### Key Decisions

- Started Step 9 execution (`08-test-plan.md`) to add required integration and E2E coverage across Metaboost and Podverse.
- Added API integration assertions for new capability metadata (`preferred_currency`, `minimum_message_amount_minor`, `conversion_endpoint_url`) and strict denomination failures (`amount_unit` missing/invalid) for both mb-v1 and mbrss-v1.
- Expanded public conversion endpoint integration coverage for identity conversion, unsupported currency/unit validation, unavailable-rate `503`, and round-half-up minor-unit behavior.
- Added management-api integration coverage for `preferredCurrency` defaults/update validation and conversion endpoint URL presence in bucket responses.
- Added Metaboost web and management-web E2E coverage for threshold-save descendant scope prompt behavior, and added a dedicated web E2E spec for the public exchange-rates calculator flow.
- Added supplementary Podverse shared currency-input utility tests for precision and deterministic invalid-input handling; Podverse Playwright E2E coverage remains unavailable in this workspace.
- Marked Step 9 completed in `COPY-PASTA.md`, updated execution order, and moved plan `08-test-plan.md` from active to completed.

#### Files Modified

- .llm/history/active/metaboost-bucket-currency-threshold-implementation/metaboost-bucket-currency-threshold-implementation-part-02.md
- apps/api/src/test/mb-v1-spec-contract.test.ts
- apps/api/src/test/mbrss-v1-spec-contract.test.ts
- apps/api/src/test/buckets.test.ts
- apps/api/src/test/exchange-rates-service.test.ts
- apps/management-api/src/test/management-buckets-messages.test.ts
- apps/web/e2e/bucket-settings-bucket-owner.spec.ts
- apps/web/e2e/exchange-rates-public.spec.ts
- apps/management-web/e2e/bucket-settings-super-admin-full-crud.spec.ts
- makefiles/local/e2e-spec-order-web.txt
- .llm/plans/active/metaboost-bucket-currency-threshold/COPY-PASTA.md
- .llm/plans/active/metaboost-bucket-currency-threshold/00-EXECUTION-ORDER.md
- .llm/plans/completed/metaboost-bucket-currency-threshold/08-test-plan.md
- .llm/plans/active/metaboost-bucket-currency-threshold/08-test-plan.md (deleted)

### Session 26 - 2026-04-19

#### Prompt (Developer)

Metaboost Bucket Threshold Closeout

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Fully closed out the original threshold plan set by moving all remaining files from active to completed so no active `metaboost-bucket-currency-threshold` folder remains.
- Created a new follow-up active plan set dedicated to the remaining Podverse E2E coverage gap for currency-threshold UX.
- Added explicit follow-up execution docs (`00-SUMMARY`, `00-EXECUTION-ORDER`, `COPY-PASTA`, and `01-podverse-e2e-currency-threshold-matrix`) so remaining work is isolated and executable.

#### Files Modified

- .llm/plans/completed/metaboost-bucket-currency-threshold/00-SUMMARY.md (moved from active)
- .llm/plans/completed/metaboost-bucket-currency-threshold/00-EXECUTION-ORDER.md (moved from active)
- .llm/plans/completed/metaboost-bucket-currency-threshold/COPY-PASTA.md (moved from active)
- .llm/plans/completed/metaboost-bucket-currency-threshold/01-domain-model-and-schema.md (moved from active)
- .llm/plans/completed/metaboost-bucket-currency-threshold/02-bucket-settings-api-and-cascade.md (moved from active)
- .llm/plans/completed/metaboost-bucket-currency-threshold/03-conversion-service-and-currency-catalog.md (moved from active)
- .llm/plans/completed/metaboost-bucket-currency-threshold/04-public-conversion-endpoint-and-bucket-response-url.md (moved from active)
- .llm/plans/completed/metaboost-bucket-currency-threshold/05-metaboost-web-exchange-rates-page.md (moved from active)
- .llm/plans/completed/metaboost-bucket-currency-threshold/06-podverse-donate-threshold-and-conversion-ux.md (moved from active)
- .llm/plans/completed/metaboost-bucket-currency-threshold/06-podverse-threshold-conversion-ux/ (moved from active)
- .llm/plans/completed/metaboost-bucket-currency-threshold/07-openapi-docs-env-and-k8s.md (moved from active)
- .llm/plans/completed/metaboost-bucket-currency-threshold/08-test-plan.md (moved from active)
- .llm/plans/completed/metaboost-bucket-currency-threshold/09-threshold-filter-sql-path-and-query-rename.md (moved from active)
- .llm/plans/completed/metaboost-bucket-currency-threshold/10-legacy-row-behavior-and-contract-clarity.md (moved from active)
- .llm/plans/completed/metaboost-bucket-currency-threshold/11-podverse-boost-form-currency-input-formatting.md (moved from active)
- .llm/plans/completed/metaboost-bucket-currency-threshold/12-podverse-boost-form-currency-input-integration.md (moved from active)
- .llm/plans/completed/metaboost-bucket-currency-threshold/13-podverse-boost-form-currency-input-validation-and-e2e.md (moved from active)
- .llm/plans/active/metaboost-bucket-currency-threshold-followups/00-SUMMARY.md (new)
- .llm/plans/active/metaboost-bucket-currency-threshold-followups/00-EXECUTION-ORDER.md (new)
- .llm/plans/active/metaboost-bucket-currency-threshold-followups/COPY-PASTA.md (new)
- .llm/plans/active/metaboost-bucket-currency-threshold-followups/01-podverse-e2e-currency-threshold-matrix.md (new)
- .llm/history/active/metaboost-bucket-currency-threshold-implementation/metaboost-bucket-currency-threshold-implementation-part-02.md
