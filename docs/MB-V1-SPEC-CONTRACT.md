# mb-v1 spec contract

## Path semantics

- mb-v1 standard path shapes are prefixless.
- MetaBoost implements mb-v1 under `/v1/standard/mb-v1/...` as a routing convention.

## Capability endpoint

- `GET /boost/:bucketShortId` → `GET /v1/standard/mb-v1/boost/:bucketShortId`

Response includes `schema: "mb-v1"`, `message_char_limit`, `terms_of_service_url`, `schema_definition_url`, and optional `public_messages_url` for public buckets.

## Ingest endpoint

- `POST /boost/:bucketShortId` → `POST /v1/standard/mb-v1/boost/:bucketShortId`

Body: same core fields as mbrss-v1 **without** RSS identity fields (`feed_guid`, `feed_title`, `item_guid`, `item_title`, `podcast_index_feed_id`). Requires `Authorization: AppAssertion` for POST.

## Public messages

- `GET /messages/public/:bucketShortId` lists public boost messages for the bucket.
- Optional query `minimumAmountMinor` applies a minimum amount filter in root preferred-currency minor units.
- The minimum filter uses the message value create-time threshold snapshot (`threshold_currency_at_create`, `threshold_amount_minor_at_create`) and applies `max(request minimumAmountMinor, root bucket minimumMessageAmountMinor)`.

OpenAPI: `/v1/standard/mb-v1/openapi.json`.
