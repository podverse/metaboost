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

Behavior:

- Public endpoints filter to `payment_verified_by_app = true`.
- Private owner/admin views can request unverified inclusion.

## Migration Plan

1. Add new enum/type and columns with safe defaults for existing rows.
2. Backfill existing buckets:
   - top-level -> `group`
   - child buckets -> `group` for compatibility in phase 1, then guard new creates by rules
3. Create joined RSS tables.
4. Add message columns and backfill:
   - generate `message_guid` for existing rows
   - set `payment_verified_by_app = true` for legacy rows to avoid hidden historical messages
5. Add indexes:
   - `bucket(type)`
   - `bucket(parent_bucket_id, type)`
   - `bucket_rss_item_info(rss_item_guid)`
   - `bucket_message(message_guid)`
   - `bucket_message(payment_verified_by_app, created_at)`

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

## Verification

- Add migration tests if repo has migration verification harness.
- Add API integration tests covering hierarchy and message visibility side effects.
