# mbrss-v1 spec contract

## Path semantics

- mbrss-v1 standard path shapes are prefixless.
- MetaBoost implements mbrss-v1 under `/v1/s/mbrss-v1/...` as a routing convention.
- `/s/mbrss-v1` is not part of the mbrss-v1 standard itself.

## Canonical RSS tag

Publish this tag in the RSS channel block:

```xml
<podcast:metaBoost standard="mbrss-v1">{API_PUBLIC_BASE_URL}{API_VERSION_PATH}/s/mbrss-v1/boost/<bucketShortId>/</podcast:metaBoost>
```

Example (production): `https://api.example.com` + `/v1` + `/s/mbrss-v1/boost/<bucketShortId>/`.

Rules:

- `standard` must be `mbrss-v1`.
- **Web / RSS:** Use your deployment’s public API origin and version path (`NEXT_PUBLIC_API_PUBLIC_BASE_URL`, `NEXT_PUBLIC_API_VERSION_PATH` in the Metaboost web app). The Add RSS UI shows the exact tag for the current environment.
- Standard path shape stays `/boost/<bucketShortId>/`.
- MetaBoost mapping is `/v1/s/mbrss-v1/boost/<bucketShortId>/`.

## Capability endpoint

mbrss-v1 standard path:

- `GET /boost/:bucketShortId`

MetaBoost implementation mapping:

- `GET /v1/s/mbrss-v1/boost/:bucketShortId`

Response:

- `schema`
- `message_char_limit`
- `terms_of_service_url` (configured by deployment env `API_MESSAGES_TERMS_OF_SERVICE_URL`, typically pointing at `/terms`)
- `schema_definition_url`
- `public_messages_url` (optional; present when public messages are enabled)

## Ingest endpoint

mbrss-v1 standard path:

- `POST /boost/:bucketShortId`

MetaBoost implementation mapping:

- `POST /v1/s/mbrss-v1/boost/:bucketShortId`

Body:

- `currency` (required)
- `amount` (required)
- `amount_unit` (optional; omitted means null / unspecified unit)
- `action` (required; `boost` or `stream`)
- `app_name` (required)
- `app_version` (optional)
- `sender_name` (optional)
- `sender_id` (optional)
- `message` (optional; must be within `message_char_limit`)
- `feed_guid` (required)
- `podcast_index_feed_id` (optional; Podcast Index feed numeric id)
- `feed_title` (required)
- `item_guid` (optional, but required when `item_title` is provided)
- `item_title` (optional, but required when `item_guid` is provided)
- `time_position` (optional; numeric seconds in media item)

Success:

- `action=boost`: returns `message_guid`
- `action=stream`: no message is created and response indicates `message_sent=false`

**Client ordering:** After split payments run, send this POST once the largest split recipient’s
payment has succeeded.

## Public message endpoints

mbrss-v1 standard paths:

- `GET /messages/public/:bucketShortId`
- `GET /messages/public/:bucketShortId/channel/:podcastGuid`
- `GET /messages/public/:bucketShortId/item/:itemGuid`

MetaBoost implementation mappings:

- `GET /v1/s/mbrss-v1/messages/public/:bucketShortId`
- `GET /v1/s/mbrss-v1/messages/public/:bucketShortId/channel/:podcastGuid`
- `GET /v1/s/mbrss-v1/messages/public/:bucketShortId/item/:itemGuid`

Rules:

- Public-only message output: persisted boost messages as stored.
- Only `action=boost` messages are returned by current message endpoints.
- `action=stream` records are intentionally excluded from current message retrieval and display paths.
- Reverse chronological ordering.
- Channel/item routes provide scoped retrieval paths.

Amount + unit notes:

- `amount_unit` is optional and may be omitted.
- Omitted `amount_unit` should be treated as null / unspecified (no inferred default).
- BTC + satoshis representation is expressed as `currency=BTC` and `amount_unit=satoshis`.
- `message` remains optional when `action=boost`.

## Error contract

Error responses include:

- HTTP status code
- `message` with specific context
- optional structured validation details when applicable

## OpenAPI

See `apps/api/src/openapi-mbrssV1.ts` for canonical mbrss-v1 request/response schema definitions.
