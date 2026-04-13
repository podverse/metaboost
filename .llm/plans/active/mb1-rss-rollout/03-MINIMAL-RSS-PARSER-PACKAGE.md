# 03 - Minimal RSS Parser Package

## Scope

Create a shared parser package for minimal RSS extraction needed by Metaboost mb1 flows.

## Package Goal

Expose a permissive parser that extracts only:

- channel title
- channel podcast guid
- channel metaboost URL/tag payload
- items: title, guid, pubDate

It must not require full feed validity beyond these fields.

## Proposed Package

- `packages/rss-parser-minimal` (name may be adjusted to repo conventions)

Exports:

- `parseMinimalRss(xml: string): ParsedMinimalRss`
- `normalizeMinimalRss(parsed: ParsedMinimalRss): NormalizedMinimalRss`
- `hashFeedContent(xml: string): string`

## Types

`ParsedMinimalRss`:

- `channelTitle?: string`
- `podcastGuid?: string`
- `metaBoostUrl?: string`
- `items: Array<{ title?: string; guid?: string; pubDate?: string }>`

`NormalizedMinimalRss`:

- required normalized channel fields
- normalized items with parsed timestamp
- deduped item map keyed by guid (newest pubDate wins)

## Parsing Rules

- Parse XML with namespace-aware support for `podcast:*` tags.
- Read `<podcast:metaBoost>` directly under `<channel>`.
- Read `standard` attribute and tag value URL.
- Treat missing optional fields as absent, not fatal, until caller validation.
- Ignore unknown tags.
- Keep stable behavior on invalid XML by returning explicit parse errors.

## Validation Responsibilities

Parser should not enforce business rules such as:

- whether metaboost URL matches expected bucket
- whether guid format is UUID
- whether item hierarchy exists in DB

Those belong in API service logic.

## Feed Hashing

- Hash raw feed content before expensive synchronization logic.
- Use deterministic algorithm available in Node runtime (for example SHA-256).
- Persist hash only after successful parse/sync.

## Integration Points

- `apps/api` bucket create flow for RSS Channel.
- `apps/api` verification endpoint and sync worker logic.
- Future: management-api parity and background sync jobs.

## Error Contract

Expose parser errors with structured shape:

- `code` (`invalid_xml`, `missing_channel`, `unsupported_structure`, etc.)
- `message` human-readable
- optional `details`

## Tests

Add package unit tests covering:

- happy path with required fields
- missing channel title/guid
- missing metaBoost tag
- duplicate item guid with pubDate tie-break
- malformed XML
- feeds with unrelated tags and namespaces
