### Session 28 - 2026-04-20

#### Prompt (Developer)

Ratio Snapshot Conversion Plan

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Added a new public bucket conversion snapshot endpoint (`/v1/buckets/public/:id/conversion-snapshot`) that validates `source_currency` + `amount_unit` and returns deterministic ratio metadata instead of per-amount conversions.
- Kept server-side exchange-rate fetch/caching centralized while exposing client math inputs (source/target unit exponents, decimal major-unit ratios, and rounding mode) so Podverse can convert locally.
- Extended public bucket/capability contracts and OpenAPI docs with conversion snapshot endpoint URLs and updated CORS public-path matching so browsers can preflight the new route.

#### Files Modified

- apps/api/src/controllers/exchangeRatesController.ts
- apps/api/src/routes/buckets.ts
- apps/api/src/lib/bucket-response.ts
- apps/api/src/controllers/mbV1Controller.ts
- apps/api/src/controllers/mbrssV1Controller.ts
- apps/api/src/app.ts
- apps/api/src/openapi.ts
- apps/api/src/openapi-mbV1.ts
- apps/api/src/openapi-mbrssV1.ts
- apps/api/src/test/buckets.test.ts
- apps/api/src/test/cors-path.test.ts
- packages/helpers-requests/src/types/bucket-types.ts
- packages/helpers-requests/src/types/index.ts
- packages/helpers-requests/src/index.ts
- packages/helpers-requests/src/web/buckets.ts
- .llm/history/active/metaboost-bucket-currency-threshold-implementation/metaboost-bucket-currency-threshold-implementation-part-03.md

### Session 29 - 2026-04-20

#### Prompt (Developer)

Unify Metaboost bucket `/conversion` to ratio-only semantics

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Replaced legacy per-amount `convertPublicBucketAmount` with ratio-only handler `getPublicBucketConversionRatios` on `GET /buckets/public/:id/conversion`; kept `/conversion-snapshot` as a deprecated alias to the same handler for backward compatibility.
- Removed `conversion_snapshot_endpoint_url` from bucket JSON and mb-v1/mbrss-v1 capability responses; OpenAPI describes a single ratio response schema for `/conversion`.
- Consolidated `@metaboost/helpers-requests` `PublicBucketConversion` type to the ratio shape and routed `reqFetchPublicBucketConversionSnapshot` to `/conversion`; removed `reqConvertPublicBucketAmount`.

#### Files Modified

- apps/api/src/controllers/exchangeRatesController.ts
- apps/api/src/routes/buckets.ts
- apps/api/src/openapi.ts
- apps/api/src/openapi-mbV1.ts
- apps/api/src/openapi-mbrssV1.ts
- apps/api/src/lib/bucket-response.ts
- apps/api/src/controllers/mbV1Controller.ts
- apps/api/src/controllers/mbrssV1Controller.ts
- apps/api/src/test/buckets.test.ts
- docs/api/STANDARD-ENDPOINT-INTEGRATION-GUIDE.md
- packages/helpers-requests/src/types/bucket-types.ts
- packages/helpers-requests/src/web/buckets.ts
- .llm/history/active/metaboost-bucket-currency-threshold-implementation/metaboost-bucket-currency-threshold-implementation-part-03.md


### Session 30 - 2026-04-20

#### Prompt (Developer)

update podverse and metaboost accordingly to support the plural naming convention standard

make sure to remove any stale references to singular in the process, we want to hard separate from the old way of doing it, no fallbacks needed

#### Key Decisions

- Standardized BTC amount unit naming to plural-only (`satoshis`) in Metaboost currency normalization, OpenAPI specs, tests, and docs.
- Kept `/conversion` ratio-only behavior while requiring strict plural `amount_unit` validation with no singular compatibility path.
- Updated API contract tests to current Joi validation error text where schema-level validation now rejects invalid/missing amount units before controller-level normalization checks.

#### Files Modified

- packages/helpers-currency/src/currency-catalog.ts
- packages/helpers/src/mbrssV1/constants.ts
- apps/api/src/openapi.ts
- apps/api/src/openapi-mbV1.ts
- apps/api/src/openapi-mbrssV1.ts
- apps/api/src/test/mb-v1-spec-contract.test.ts
- apps/api/src/test/mbrss-v1-spec-contract.test.ts
- apps/api/src/test/buckets.test.ts
- apps/api/src/test/exchange-rates-service.test.ts
- apps/web/src/app/(main)/exchange-rates/ExchangeRatesPageClient.tsx
- apps/web/src/app/(main)/buckets/BucketForm.tsx
- apps/management-web/src/components/buckets/BucketForm.tsx
- apps/web/src/lib/bucketMessagesMapShared.ts
- docs/MB-V1-SPEC-CONTRACT.md
- docs/MBRSS-V1-SPEC-CONTRACT.md
- tools/generate-data/src/main/seed.ts
- .llm/history/active/metaboost-bucket-currency-threshold-implementation/metaboost-bucket-currency-threshold-implementation-part-03.md


### Session 31 - 2026-04-20

#### Prompt (Developer)

Hard Cutover to Canonical Amount Units

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

@metaboost/packages/helpers-currency/src/currency-catalog.ts:1-185 i am confused why i see so many singular currency in here. i wanted us to standardize on the plural way of writing amount units. what is the hang up?

i suppose part of the issue is that when we talk to frankfurter app api we may need to use whatever amount unit they expect? is that a problem? or do you think we can safely standardize on plural amount unit across everything in podverse and metaboost?

also, if we render amount unit in text, we are ok with the possibility of rendering the amount unit as plural even if it is for one unit. (ex. "1 satoshis " is ok. we want to standardize on plural, not singular)

standardize as plural across everything podverse and metaboost. we do not want fallbacks or migration comments. we want a hard change from singular to plural. also, if an amount unit does not have a plural form, it is ok to specify singular form in the contract, but each amount unit should only have one valid contract form

#### Key Decisions

- Per-currency denomination contracts now use exactly one canonical token; plural forms are used where available (`cents`, `centavos`, `satoshis`) and singular forms remain only where no alternate plural token is used in contract (`pence`, `yen`, `ore`, `won`, etc.).
- API validation in mb-v1 and mbrss-v1 now requires `cents` (not `cent`) for non-BTC boosts.
- OpenAPI/docs/examples were updated to canonical plural tokens only with no fallback or compatibility notes.

#### Files Modified

- packages/helpers-currency/src/currency-catalog.ts
- apps/api/src/schemas/mbV1.ts
- apps/api/src/schemas/mbrssV1.ts
- apps/api/src/openapi.ts
- apps/api/src/openapi-mbV1.ts
- apps/api/src/openapi-mbrssV1.ts
- apps/api/src/test/buckets.test.ts
- apps/api/src/test/mb-v1-spec-contract.test.ts
- apps/api/src/test/mbrss-v1-spec-contract.test.ts
- apps/web/src/app/(main)/exchange-rates/ExchangeRatesPageClient.tsx
- apps/web/src/app/(main)/exchange-rates/page.tsx
- apps/web/src/app/(main)/buckets/BucketForm.tsx
- apps/management-web/src/components/buckets/BucketForm.tsx
- apps/web/i18n/originals/en-US.json
- apps/web/i18n/originals/es.json
- apps/web/i18n/overrides/es.json
- apps/management-web/i18n/originals/en-US.json
- apps/management-web/i18n/originals/es.json
- apps/management-web/i18n/overrides/es.json
- docs/MB-V1-SPEC-CONTRACT.md
- docs/MBRSS-V1-SPEC-CONTRACT.md
- docs/api/STANDARD-ENDPOINT-INTEGRATION-GUIDE.md
- tools/generate-data/src/main/seed.ts
