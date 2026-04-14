# MB1 Spec Contract

## Path Semantics

- MB1 standard path shapes are prefixless.
- MetaBoost implements MB1 under `/v1/s/mb1/...` as a routing convention.
- `/s/mb1` is not part of the MB1 standard itself.

## Canonical RSS Tag

Publish this tag in the RSS channel block:

```xml
<podcast:metaBoost standard="mb1">https://api.metaboost.cc/v1/s/mb1/boost/<bucketShortId>/</podcast:metaBoost>
```

Rules:

- `standard` must be `mb1`.
- Host may vary by environment.
- Standard path shape stays `/boost/<bucketShortId>/`.
- MetaBoost mapping is `/v1/s/mb1/boost/<bucketShortId>/`.

## Capability Endpoint

MB1 standard path:

- `GET /boost/:bucketShortId`

MetaBoost implementation mapping:

- `GET /v1/s/mb1/boost/:bucketShortId`

Response:

- `schema`
- `message_char_limit`
- `terms_of_service_url` (configured by deployment env `API_MESSAGES_TERMS_OF_SERVICE_URL`, typically pointing at `/terms`)
- `schema_definition_url`
- `public_messages_url` (optional; present when public messages are enabled)

## Ingest Endpoint

MB1 standard path:

- `POST /boost/:bucketShortId`

MetaBoost implementation mapping:

- `POST /v1/s/mb1/boost/:bucketShortId`

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

## Payment Confirmation Endpoint

MB1 standard path:

- `POST /boost/:bucketShortId/confirm-payment`

MetaBoost implementation mapping:

- `POST /v1/s/mb1/boost/:bucketShortId/confirm-payment`

Body:

- `message_guid` (required)
- `recipient_outcomes` (required array, minimum 1)
  - each object is strictly parsed by the server and only accepts:
    - `type` (required)
    - `address` (required)
    - `split` (required number)
    - `name` (optional nullable)
    - `custom_key` (optional nullable)
    - `custom_value` (optional nullable)
    - `fee` (required boolean)
    - `status` (required enum: `verified` | `failed` | `undetermined`)

Verification derivation:

- `fully-verified`: all recipients are `verified`.
- `verified-largest-recipient-succeeded`: largest `split` recipient is `verified`, with at least
  one non-largest recipient `failed` or `undetermined`.
- `partially-verified`: at least one recipient is `verified`, but the largest recipient is not
  `verified`.
- `not-verified`: no recipients are `verified`.

Compatibility:

- Response continues to include `payment_verified_by_app` for compatibility, now derived from level:
  - `true` for `fully-verified` and `verified-largest-recipient-succeeded`
  - `false` for `partially-verified` and `not-verified`

## Public Message Endpoints

MB1 standard paths:

- `GET /messages/public/:bucketShortId`
- `GET /messages/public/:bucketShortId/channel/:podcastGuid`
- `GET /messages/public/:bucketShortId/item/:itemGuid`

MetaBoost implementation mappings:

- `GET /v1/s/mb1/messages/public/:bucketShortId`
- `GET /v1/s/mb1/messages/public/:bucketShortId/channel/:podcastGuid`
- `GET /v1/s/mb1/messages/public/:bucketShortId/item/:itemGuid`

Rules:

- Public-only message output.
- Default verification threshold is `verified-largest-recipient-succeeded` (also includes
  `fully-verified`).
- Optional filters:
  - `includePartiallyVerified=true` includes `partially-verified` in addition to default.
  - `includeUnverified=true` includes `not-verified` in addition to higher levels.
- Only `action=boost` messages are returned by current message endpoints.
- `action=stream` records are intentionally excluded from current message retrieval and display paths.
- Reverse chronological ordering.
- Channel/item routes provide scoped retrieval paths.

Amount + unit notes:

- `amount_unit` is optional and may be omitted.
- Omitted `amount_unit` should be treated as null / unspecified (no inferred default).
- BTC + sats representation is expressed as `currency=BTC` and `amount_unit=sats`.
- `message` remains optional when `action=boost`.

## Error Contract

Error responses include:

- HTTP status code
- `message` with specific context
- optional structured validation details when applicable

## OpenAPI

See `apps/api/src/openapi-mb1.ts` for canonical MB1 request/response schema definitions.

## Rollout and rollback notes

Recommended rollout order:

1. Deploy DB and API changes that support recipient-outcomes payloads.
2. Deploy web/management-web filter and verification-state UI updates.
3. Deploy Podverse confirm-payment signaling that posts `recipient_outcomes`.

Rollback guidance:

- Keep legacy compatibility in place for mixed deployments by accepting/producing
  `payment_verified_by_app` as a derived field.
- Podverse clients may temporarily fall back to legacy boolean confirm payload when an older
  endpoint does not accept recipient outcomes.
