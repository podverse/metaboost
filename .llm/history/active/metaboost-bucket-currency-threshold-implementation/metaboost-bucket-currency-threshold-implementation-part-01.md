### Session 1 - 2026-04-19

#### Prompt (Developer)

@metaboost/.llm/plans/active/metaboost-bucket-currency-threshold/COPY-PASTA.md:9-11

#### Key Decisions

- Updated both API and management-api bucket update schemas to use `preferredCurrency` and `minimumMessageAmountMinor` with explicit supported-currency validation and integer minor-unit bounds.
- Wired controllers to persist and cascade the new settings fields via `BucketService.update` and `BucketService.applyGeneralSettingsToDescendants`.
- Updated API and management bucket serializers to return `preferredCurrency`, `minimumMessageAmountMinor`, and a placeholder `conversionEndpointUrl`.
- Updated shared helper-request bucket types and request body types for web and management-web clients to match the new bucket contract.
- Updated message threshold resolution to read root `minimumMessageAmountMinor`, documenting Step 2 contract alignment pending full conversion flow in Steps 3/4.
- Marked Step 2 complete in `COPY-PASTA.md`, marked Step 3 as next, and moved `02-bucket-settings-api-and-cascade.md` to completed plans.
- Rebuilt `packages/helpers`, `packages/orm`, and `packages/helpers-requests` to refresh TypeScript declarations consumed by app workspaces.

#### Files Modified

- apps/api/src/schemas/buckets.ts
- apps/management-api/src/schemas/buckets.ts
- apps/api/src/controllers/bucketsController.ts
- apps/management-api/src/controllers/bucketsController.ts
- apps/api/src/lib/bucket-response.ts
- apps/management-api/src/lib/bucketToJson.ts
- packages/helpers-requests/src/types/bucket-types.ts
- packages/helpers-requests/src/web/buckets.ts
- packages/helpers-requests/src/management-web/buckets.ts
- apps/api/src/controllers/bucketMessagesController.ts
- .llm/plans/active/metaboost-bucket-currency-threshold/COPY-PASTA.md
- .llm/plans/completed/metaboost-bucket-currency-threshold/02-bucket-settings-api-and-cascade.md
- .llm/history/active/metaboost-bucket-currency-threshold-implementation/metaboost-bucket-currency-threshold-implementation-part-01.md
- .llm/history/active/metaboost-bucket-currency-threshold-implementation/metaboost-bucket-currency-threshold-implementation-part-01.md

### Session 2 - 2026-04-19

#### Prompt (Developer)

@metaboost/.llm/plans/active/metaboost-bucket-currency-threshold/COPY-PASTA.md:9-12 implement. also, as you finish these steps i am about to give you, when they're completed, you should make the steps as completed in copy pasta and move the plan file to completed

#### Key Decisions

- Completed Step 1 using clean-slate domain/schema semantics by removing USD-specific aliases and backfill guidance from the step-owned files.
- Kept `BucketService` minimum/currency defaults as local class constants to avoid monorepo stale export/type cache failures during this step.
- Marked Step 1 as completed and Step 2 as next in `COPY-PASTA.md`.
- Moved `01-domain-model-and-schema.md` from active to completed plan-set path.

#### Files Modified

- infra/k8s/base/db/postgres-init/0003_app_schema.sql
- packages/orm/src/entities/BucketSettings.ts
- packages/orm/src/services/BucketService.ts
- packages/helpers/src/db/field-lengths.ts
- packages/helpers/src/db/index.ts
- packages/helpers/src/index.ts
- .llm/plans/active/metaboost-bucket-currency-threshold/COPY-PASTA.md
- .llm/plans/completed/metaboost-bucket-currency-threshold/01-domain-model-and-schema.md
- .llm/history/active/metaboost-bucket-currency-threshold-implementation/metaboost-bucket-currency-threshold-implementation-part-01.md

### Session 3 - 2026-04-19

#### Prompt (Developer)

@/Users/mitcheldowney/.cursor/projects/Users-mitcheldowney-repos-pv-podverse-ansible/terminals/10.txt:92-147 it looks like there are many merge conflicts. can you fix them, bearing in mind the direction we plan to go in with active plan files?

#### Key Decisions

- Resolved all stash-pop merge conflicts by taking the stashed side for conflicted files, because those hunks aligned with the active currency-threshold plan direction.
- Preserved Step 1 clean-slate schema/domain naming (`preferred_currency`, `minimum_message_amount_minor`) over legacy USD-specific fields.
- Kept test-file conflict resolutions consistent with formatter output where conflicts were formatting-only.

#### Files Modified

- apps/api/src/test/buckets.test.ts
- apps/api/src/test/mbrss-v1-spec-contract.test.ts
- apps/management-api/src/test/management-buckets-messages.test.ts
- apps/management-web/e2e/bucket-settings-super-admin-full-crud.spec.ts
- apps/web/e2e/bucket-settings-bucket-owner.spec.ts
- infra/k8s/base/db/postgres-init/0003_app_schema.sql
- packages/helpers/src/db/field-lengths.ts
- packages/helpers/src/db/index.ts
- packages/helpers/src/index.ts
- packages/orm/src/entities/BucketSettings.ts
- packages/orm/src/services/BucketService.ts
- .llm/history/active/metaboost-bucket-currency-threshold-implementation/metaboost-bucket-currency-threshold-implementation-part-01.md

### Session 4 - 2026-04-19

#### Prompt (Developer)

@metaboost/.llm/plans/active/metaboost-bucket-currency-threshold/COPY-PASTA.md:17-19

#### Key Decisions

- Updated both API and management-api bucket update schemas to use `preferredCurrency` and `minimumMessageAmountMinor` with explicit supported-currency validation and integer minor-unit bounds.
- Wired controllers to persist and cascade the new settings fields via `BucketService.update` and `BucketService.applyGeneralSettingsToDescendants`.
- Updated API and management bucket serializers to return `preferredCurrency`, `minimumMessageAmountMinor`, and a placeholder `conversionEndpointUrl`.
- Updated shared helper-request bucket types and request body types for web and management-web clients to match the new bucket contract.
- Updated message threshold resolution to read root `minimumMessageAmountMinor`, documenting Step 2 contract alignment pending full conversion flow in Steps 3/4.
- Marked Step 2 complete in `COPY-PASTA.md`, marked Step 3 as next, and moved `02-bucket-settings-api-and-cascade.md` to completed plans.
- Rebuilt `packages/helpers`, `packages/orm`, and `packages/helpers-requests` to refresh TypeScript declarations consumed by app workspaces.

#### Files Modified

- apps/api/src/schemas/buckets.ts
- apps/management-api/src/schemas/buckets.ts
- apps/api/src/controllers/bucketsController.ts
- apps/management-api/src/controllers/bucketsController.ts
- apps/api/src/lib/bucket-response.ts
- apps/management-api/src/lib/bucketToJson.ts
- packages/helpers-requests/src/types/bucket-types.ts
- packages/helpers-requests/src/web/buckets.ts
- packages/helpers-requests/src/management-web/buckets.ts
- apps/api/src/controllers/bucketMessagesController.ts
- .llm/plans/active/metaboost-bucket-currency-threshold/COPY-PASTA.md
- .llm/plans/completed/metaboost-bucket-currency-threshold/02-bucket-settings-api-and-cascade.md
- .llm/history/active/metaboost-bucket-currency-threshold-implementation/metaboost-bucket-currency-threshold-implementation-part-01.md

### Session 5 - 2026-04-19

#### Prompt (Developer)

@metaboost/.llm/plans/active/metaboost-bucket-currency-threshold/COPY-PASTA.md:26-29

#### Key Decisions

- Added a hardcoded ordered supported-currency catalog (`USD`, `BTC`, then major fiat) and denomination registry with canonical `amount_unit` normalization.
- Enforced strict denomination parsing by requiring explicit `amount_unit`, rejecting missing/invalid units, and removing implicit unit fallbacks in standard-ingest normalization.
- Updated MB-V1 and MBRSS-V1 schemas to require integer minor-unit `amount` values and required `amount_unit` with BTC satoshi-only handling.
- Refactored exchange-rate conversion to use denomination metadata and integer minor-unit semantics with round-half-up conversion helpers.
- Added server-standard-currency and stale-cache-window config handling for exchange-rate fallback behavior.
- Updated preferred-currency validation to use expanded supported currency sets for bucket schema updates.
- Marked Step 3 complete in `COPY-PASTA.md`, marked Step 4 as next, and moved `03-conversion-service-and-currency-catalog.md` to completed plans.

#### Files Modified

- apps/api/src/lib/currency-catalog.ts
- apps/api/src/lib/exchangeRates.ts
- apps/api/src/lib/standardIngest/currency.ts
- apps/api/src/lib/standardIngest/persistBoostMessage.ts
- apps/api/src/controllers/mbV1Controller.ts
- apps/api/src/controllers/mbrssV1Controller.ts
- apps/api/src/schemas/mbV1.ts
- apps/api/src/schemas/mbrssV1.ts
- apps/api/src/config/index.ts
- apps/api/src/schemas/buckets.ts
- apps/management-api/src/schemas/buckets.ts
- .llm/plans/active/metaboost-bucket-currency-threshold/COPY-PASTA.md
- .llm/plans/completed/metaboost-bucket-currency-threshold/03-conversion-service-and-currency-catalog.md
- .llm/history/active/metaboost-bucket-currency-threshold-implementation/metaboost-bucket-currency-threshold-implementation-part-01.md

### Session 6 - 2026-04-19

#### Prompt (Developer)

Isolate Currency Helpers Package

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Added a new workspace package `@metaboost/helpers-currency` and moved currency-catalog/domain utilities out of `apps/api`.
- Registered the package in root workspaces and explicit build/type/dev script chains so it participates in normal workspace workflows.
- Migrated API and management-api consumers to import currency helpers from `@metaboost/helpers-currency` instead of app-local modules.
- Removed the old `apps/api/src/lib/currency-catalog.ts` file after consumer migration.
- Added `@metaboost/helpers-currency` dependencies to `@metaboost/api` and `@metaboost/management-api` package manifests.
- Ran targeted builds for `@metaboost/helpers-currency`, `@metaboost/api`, and `@metaboost/management-api`, then resolved compile/lint fallout in existing Step 3-related tests/controllers.
- Ran targeted ESLint on migrated currency consumer files and fixed import-order and caught-error-cause issues.

#### Files Modified

- package.json
- package-lock.json
- packages/helpers-currency/package.json
- packages/helpers-currency/tsconfig.json
- packages/helpers-currency/src/index.ts
- packages/helpers-currency/src/currency-catalog.ts
- apps/api/package.json
- apps/management-api/package.json
- apps/api/src/config/index.ts
- apps/api/src/lib/exchangeRates.ts
- apps/api/src/lib/standardIngest/currency.ts
- apps/api/src/controllers/mbV1Controller.ts
- apps/api/src/controllers/mbrssV1Controller.ts
- apps/api/src/schemas/buckets.ts
- apps/management-api/src/schemas/buckets.ts
- apps/api/src/test/buckets.test.ts
- apps/api/src/test/mb-v1-spec-contract.test.ts
- apps/api/src/test/mbrss-v1-spec-contract.test.ts
- apps/management-api/src/controllers/bucketMessagesController.ts
- apps/management-api/src/test/management-buckets-messages.test.ts
- apps/api/src/lib/currency-catalog.ts (deleted)
- .llm/history/active/metaboost-bucket-currency-threshold-implementation/metaboost-bucket-currency-threshold-implementation-part-01.md

### Session 7 - 2026-04-19

#### Prompt (Developer)

@/Users/mitcheldowney/.cursor/projects/Users-mitcheldowney-repos-pv-podverse-ansible/terminals/10.txt:99-100 debug

#### Key Decisions

- Debugged the terminal type-check failure as stale field-name usage in web and management-web bucket settings UI code.
- Updated UI forms/settings mapping from legacy `minimumMessageUsdCents` to `minimumMessageAmountMinor` to align with current bucket/request types.
- Kept translation keys and labels unchanged in this pass to avoid scope drift; this was a compile-level field rename fix only.

#### Files Modified

- apps/web/src/app/(main)/bucket/[id]/settings/page.tsx
- apps/web/src/app/(main)/buckets/BucketForm.tsx
- apps/management-web/src/app/(main)/bucket/[id]/settings/page.tsx
- apps/management-web/src/components/buckets/BucketForm.tsx
- .llm/history/active/metaboost-bucket-currency-threshold-implementation/metaboost-bucket-currency-threshold-implementation-part-01.md

### Session 8 - 2026-04-19

#### Prompt (Developer)

@/Users/mitcheldowney/.cursor/projects/Users-mitcheldowney-repos-pv-podverse-ansible/terminals/10.txt:7-93

#### Key Decisions

- The lint failure was a single `eqeqeq` violation in `ContentPageLayout` using `!= null`.
- Replaced it with strict checks (`!== undefined && !== null`) and verified the file with targeted ESLint.

#### Files Modified

- packages/ui/src/components/layout/ContentPageLayout/ContentPageLayout.tsx
- .llm/history/active/metaboost-bucket-currency-threshold-implementation/metaboost-bucket-currency-threshold-implementation-part-01.md

### Session 9 - 2026-04-19

#### Prompt (Developer)

implement

#### Key Decisions

- Refactored BTC pricing from USD-centric fetch to fiat-base-aware fetch so conversion logic aligns with configurable server/base currency behavior.
- Replaced snapshot field `btcUsd` with `btcInBase` and removed USD pivot helper logic from conversion paths.
- Updated BTC fetch to set/query the provider quote currency by current fiat base and parse `bitcoin.<fiat_base>` directly.
- Verified changes with targeted API build and file-level ESLint.

#### Files Modified

- apps/api/src/lib/exchangeRates.ts
- .llm/history/active/metaboost-bucket-currency-threshold-implementation/metaboost-bucket-currency-threshold-implementation-part-01.md

### Session 10 - 2026-04-19

#### Prompt (Developer)

@metaboost/.llm/plans/active/metaboost-bucket-currency-threshold/COPY-PASTA.md:34-37

#### Key Decisions

- Added a new public conversion endpoint at `GET /buckets/public/:id/conversion` that requires `source_currency`, `source_amount` (minor units), and `amount_unit`, and enforces strict denomination validation via shared currency helpers.
- Switched message threshold filtering from the persisted USD snapshot filter to preferred-currency minor-unit conversion at read time using cached exchange rates, and applied it to authenticated bucket list/get endpoints and standard public list endpoints.
- Centralized threshold parsing/filtering logic into a shared API lib helper so mb-v1, mbrss-v1, and bucket message endpoints follow the same root-threshold + query-max contract and coherent pagination behavior after filtering.
- Added/updated integration tests for the conversion endpoint and threshold-list fixtures so threshold comparisons use explicit denomination units.

#### Files Modified

- apps/api/src/lib/message-threshold-filter.ts
- apps/api/src/controllers/bucketMessagesController.ts
- apps/api/src/routes/buckets.ts
- apps/api/src/controllers/mbV1Controller.ts
- apps/api/src/controllers/mbrssV1Controller.ts
- packages/helpers-requests/src/types/bucket-types.ts
- packages/helpers-requests/src/web/buckets.ts
- apps/api/src/test/buckets.test.ts
- apps/api/src/test/mb-v1-spec-contract.test.ts
- apps/api/src/test/mbrss-v1-spec-contract.test.ts
- .llm/history/active/metaboost-bucket-currency-threshold-implementation/metaboost-bucket-currency-threshold-implementation-part-01.md
