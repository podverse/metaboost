# mb-v1 spec contract

## Path semantics

- mb-v1 standard path shapes are prefixless.
- MetaBoost implements mb-v1 under `/v1/standard/mb-v1/...` as a routing convention.

## Capability endpoint

- `GET /boost/:bucketIdText` → `GET /v1/standard/mb-v1/boost/:bucketIdText`

Response includes `schema: "mb-v1"`, `message_char_limit`, `terms_of_service_url`, `schema_definition_url`, and optional `public_messages_url` for public buckets.
It also includes conversion-related metadata:

- `preferred_currency`
- optional `conversion_endpoint_url` (when the target bucket is public)

An optional owner-configured **public list display floor** (`public_boost_display_minimum_minor` on bucket settings) is **not** returned by capability; it affects message list filtering server-side only.

## Ingest endpoint

- `POST /boost/:bucketIdText` → `POST /v1/standard/mb-v1/boost/:bucketIdText`

Body: same core fields as mbrss-v1 **without** RSS identity fields (`feed_guid`, `feed_title`, `item_guid`, `item_title`, `podcast_index_feed_id`). Requires `Authorization: AppAssertion` for POST.

`amount_unit` is required and currency-specific. Examples:

- BTC -> `satoshis`
- USD/EUR/CAD/AUD/SGD/HKD/ZAR -> `cents`
- GBP -> `pence`
- JPY -> `yen`

Valid boosts are persisted subject to auth, schema, and policy checks; there is **no** bucket-level ingest rejection based on a minimum amount.

## Public messages

- `GET /messages/public/:bucketIdText` lists public boost messages for the bucket.
- Optional query `minimumAmountMinor` applies an extra minimum filter in root preferred-currency minor units.
- The effective filter uses the message value create-time threshold snapshot (`threshold_currency_at_create`, `threshold_amount_minor_at_create`) and applies `max(request minimumAmountMinor ?? 0, root bucket publicBoostDisplayMinimumMinor)`.
- When the effective minimum is greater than `0`, rows without usable threshold snapshot values are excluded.
- When the effective minimum is `0`, those rows may still appear in unfiltered results.

OpenAPI: `/v1/standard/mb-v1/openapi.json`.
