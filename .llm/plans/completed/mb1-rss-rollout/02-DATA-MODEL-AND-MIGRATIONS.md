# 02 - Data Model and Migrations

## Scope

Add persistent schema needed for RSS channel/item hierarchy, parse/verify metadata, and app-side
payment verification.

## Schema Changes

### 1) Bucket type

Add bucket type enum:

- `group`
- `rss-channel`
- `rss-item`

Add `bucket.type` column with constraints:

- top-level allowed: `group`, `rss-channel`
- child under `group` allowed: `rss-channel` only
- child under `rss-channel` allowed: `rss-item` only
- `rss-item` cannot be top-level

Implementation options:

- Enforce hard constraints with DB checks where practical.
- Enforce full hierarchy invariants in service layer plus integration tests.

### 2) RSS channel info table

Create `bucket_rss_channel_info` with:

- `bucket_id` PK + FK to `bucket`
- `rss_feed_url` string required
- `rss_podcast_guid` string required
- `rss_last_parse_attempt` timestamp nullable
- `rss_last_successful_parse` timestamp nullable
- `rss_verified` timestamp nullable
- `rss_last_parsed_feed_hash` string nullable

Constraints:

- one-to-one with `bucket`
- only valid when `bucket.type = 'rss-channel'` (enforced in service layer + tests)

### 3) RSS item info table

Create `bucket_rss_item_info` with:

- `bucket_id` PK + FK to `bucket`
- `rss_item_guid` string required
- `rss_item_pub_date` timestamp required
- `orphaned` boolean default `false`

Constraints:

- one-to-one with `bucket`
- only valid when `bucket.type = 'rss-item'`
- unique `(parent_rss_channel_bucket_id, rss_item_guid)` enforced via join-aware uniqueness in service
  layer or DB expression/trigger strategy

### 4) Message verification fields

Update `bucket_message`:

- `message_guid` UUID/string unique required for mb1 tracking
- `payment_verified_by_app` boolean default `false`
- `amount` numeric required for mb1 messages
- `currency` string required for mb1 messages
- `amount_unit` nullable string (persist `NULL` when omitted)
- `action` required enum/string: `boost | stream`
- `app_name` string required for mb1 messages
- `app_version` nullable string
- `sender_name` nullable string
- `sender_id` nullable string
- `podcast_index_feed_id` nullable number
- `time_position` nullable number

Behavior:

- Public endpoints filter to `payment_verified_by_app = true` and `action = 'boost'`.
- Current private/public message retrieval endpoints exclude `action = 'stream'` rows.
- Private owner/admin views can request unverified inclusion.
- `action = 'stream'` rows may be persisted for future analytics/retrieval endpoints, but are not part
  of current display message flows.

## Migration Plan

1. Add new enum/type and columns with safe defaults for existing rows.
2. Backfill existing buckets:
   - top-level -> `group`
   - child buckets -> authoritative target-state type values per MB1 hierarchy rules (no temporary compatibility typing)
3. Create joined RSS tables.
4. Add message columns and backfill:
   - generate `message_guid` for existing rows
   - set `payment_verified_by_app = true` for existing rows required in final MB1 target-state visibility behavior
   - set existing rows `action = 'boost'` so they align with final boost-only current-message retrieval behavior
   - leave `amount_unit` as `NULL` where unavailable; do not infer units
5. Add indexes:
   - `bucket(type)`
   - `bucket(parent_bucket_id, type)`
   - `bucket_rss_item_info(rss_item_guid)`
   - `bucket_message(message_guid)`
   - `bucket_message(payment_verified_by_app, created_at)`
   - `bucket_message(currency)`
   - `bucket_message(amount_unit)`

## ORM / Service Updates

- `packages/orm/src/entities/Bucket.ts`
- new entities:
  - `BucketRSSChannelInfo.ts`
  - `BucketRSSItemInfo.ts`
- `packages/orm/src/entities/BucketMessage.ts`
- service updates in `BucketService` and `BucketMessageService`

## Edge Cases

- Duplicate RSS item GUIDs in a feed: retain newest by `pubDate`, ignore older duplicates.
- If channel guid changes in feed, update stored `rss_podcast_guid` on successful parse.
- If parse fails, set `rss_last_parsed_feed_hash` to `null`.
- `amount_unit` missing in payload remains `NULL` in storage and UI must not imply a unit.

## Verification

- Add migration tests if repo has migration verification harness.
- Add API integration tests covering hierarchy and message visibility side effects.
