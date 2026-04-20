# mb-v1 spec contract

## Path semantics

- mb-v1 standard path shapes are prefixless.
- MetaBoost implements mb-v1 under `/v1/standard/mb-v1/...` as a routing convention.

## Capability endpoint

- `GET /boost/:bucketShortId` → `GET /v1/standard/mb-v1/boost/:bucketShortId`

Response includes `schema: "mb-v1"`, `message_char_limit`, `terms_of_service_url`, `schema_definition_url`, and optional `public_messages_url` for public buckets.
It also includes minimum boost threshold + conversion metadata:

- `preferred_currency`
- `minimum_message_amount_minor`
- optional `conversion_endpoint_url` (when the target bucket is public)

Root buckets default `minimum_message_amount_minor` to USD 0.10 equivalent at creation time (converted into the preferred currency minor units). Lower values are still allowed by configuration.

## Ingest endpoint

- `POST /boost/:bucketShortId` → `POST /v1/standard/mb-v1/boost/:bucketShortId`

Body: same core fields as mbrss-v1 **without** RSS identity fields (`feed_guid`, `feed_title`, `item_guid`, `item_title`, `podcast_index_feed_id`). Requires `Authorization: AppAssertion` for POST.

`amount_unit` is required and currency-specific. Examples:

- BTC -> `satoshis`
- USD/EUR/CAD/AUD/SGD/HKD/ZAR -> `cents`
- GBP -> `pence`
- JPY -> `yen`

## Public messages

- `GET /messages/public/:bucketShortId` lists public boost messages for the bucket.
- Optional query `minimumAmountMinor` applies a minimum boost amount filter in root preferred-currency minor units.
- The minimum filter uses the message value create-time threshold snapshot (`threshold_currency_at_create`, `threshold_amount_minor_at_create`) and applies `max(request minimumAmountMinor, root bucket minimumMessageAmountMinor)`.
- When the effective minimum is greater than `0`, rows without usable threshold snapshot values are excluded.
- When the effective minimum is `0`, those rows may still appear in unfiltered results.

OpenAPI: `/v1/standard/mb-v1/openapi.json`.
