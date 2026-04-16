# 01 - MB1 Spec Contract

## Scope

Lock and maintain the canonical MB1 wire contract so implementation and docs stay aligned.

## Canonical RSS Tag

Publisher places this in `<channel>`:

```xml
<podcast:metaBoost standard="mb1">https://api.metaboost.cc/v1/s/mb1/boost/<bucketShortId>/</podcast:metaBoost>
```

Rules:

- `standard` value must be `mb1`.
- URL host can vary by environment.
- MB1 standard path shape is prefixless (`/boost/:bucketShortId`).
- MetaBoost implementation maps MB1 routes under `/v1/s/mb1`.
- Value must resolve to the RSS Channel bucket endpoint.

## GET Capability Endpoint

Route:

- MB1 standard path: `GET /boost/:bucketShortId`
- MetaBoost mapping: `GET /v1/s/mb1/boost/:bucketShortId`

Response:

- `schema: 'mb1'`
- `message_char_limit: number`
- `terms_of_service_url: string`
- `schema_definition_url: string`
- `public_messages_url?: string` (included only when public messages are enabled for the bucket)

## POST Ingest Endpoint

Route:

- MB1 standard path: `POST /boost/:bucketShortId`
- MetaBoost mapping: `POST /v1/s/mb1/boost/:bucketShortId`

Request body:

- `currency: string` required
- `amount: number` required (float allowed)
- `amount_unit?: string` optional (persist `NULL` when omitted)
- `action: 'boost' | 'stream'` required
- `app_name: string` required
- `app_version?: string` optional (app semver/build value when available)
- `sender_name?: string`
- `sender_id?: string`
- `message?: string` (length <= `message_char_limit`)
- `feed_guid: string` required
- `podcast_index_feed_id?: number` optional (Podcast Index numeric feed id)
- `feed_title: string` required
- `item_guid?: string` required when `item_title` is present
- `item_title?: string` required when `item_guid` is present
- `time_position?: number` optional (seconds in media item timeline)

Success response:

- For `action='boost'`: `message_guid: string`
- For `action='stream'`: message is accepted as stream telemetry (no user-visible message); response
  indicates no message was sent for display

Validation behavior:

- Missing/invalid values return machine-usable error messages.
- `feed_guid` must match bucket RSS channel guid.
- If `item_guid` is provided, message routes to RSS Item bucket.
- `amount_unit` omission is valid and must be stored as `NULL` (no inferred default).
- BTC + sats handling is explicitly represented by `currency='BTC'` and `amount_unit='sats'`.
- `action='stream'` may be persisted for telemetry/analytics collection.
- Current message retrieval endpoints (private + public) must exclude `action='stream'` rows.
- `message` remains optional when `action='boost'`.

## Single-send only (historical plan note)

This plan predates the single-send MB1 contract. MetaBoost does **not** expose a follow-up HTTP route to change a message after ingest. Use the canonical spec at `docs/MB1-SPEC-CONTRACT.md` in the repo root.

## Public Message Endpoints

Routes:

- MB1 standard paths:
  - `GET /messages/public/:bucketShortId`
  - `GET /messages/public/:bucketShortId/channel/:podcastGuid`
  - `GET /messages/public/:bucketShortId/item/:itemGuid`
- MetaBoost mappings:
  - `GET /v1/s/mb1/messages/public/:bucketShortId`
  - `GET /v1/s/mb1/messages/public/:bucketShortId/channel/:podcastGuid`
  - `GET /v1/s/mb1/messages/public/:bucketShortId/item/:itemGuid`

Rules:

- Verified messages only.
- Only `action='boost'` messages are returned by current message endpoints.
- Reverse chronological by message creation time.
- `channel/:podcastGuid` and `item/:itemGuid` must target corresponding resolved buckets.
- If public messages disabled, return forbidden/not-found behavior per privacy policy.

## Error Contract

All API errors should include:

- HTTP status code
- `message` with specific validation/business reason
- optional structured field errors (`errors[]`) where existing API patterns use them

## Documentation Outputs

- Separate OpenAPI updates:
  - Metaboost API docs wiring in `apps/api/src/lib/api-docs.ts` (including standard docs registration)
  - MB1 standard endpoints in `apps/api/src/openapi-mb1.ts`
- MB1 standard write-up documenting canonical tag, endpoint behavior, and examples

## Key Files To Touch During Implementation

- `apps/api/src/routes/*`
- `apps/api/src/controllers/*`
- `apps/api/src/schemas/*`
- `docs/*` for mb1 spec
