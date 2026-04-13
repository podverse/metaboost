# MB1 RSS Rollout - Summary

## Scope

This plan set adds mb1 RSS-channel-aware boost ingestion to Metaboost with:

- Bucket type hierarchy (`group`, `rss-channel`, `rss-item`)
- RSS parsing/verification/sync flows
- mb1 capability and ingest endpoints
- Verified-only public message APIs
- Web UX for RSS setup and verification
- Public onboarding pages at `/how-to/creators` and `/how-to/developers`
- Podverse-hosted minimal public RSS example asset

## Explicitly In Scope

- `apps/api`
- `apps/web`
- `packages/orm`
- New shared parser package in this monorepo
- API/web tests and docs tied to changed behavior
- Podverse static feed asset in `apps/web/public`

## Deferred To Later Wave

- `apps/management-api`
- `apps/management-web`
- Partytime parser modification path

## Locked Decisions

- Canonical RSS tag: `<podcast:metaBoost standard="mb1">`
- Canonical endpoint style: `/boost/<bucketShortId>/`
- Custom minimal parser package (field-focused, permissive feed validity stance)
- Public endpoints return verified messages only
- Current message retrieval/display surfaces return only `action='boost'`; `action='stream'` is stored
  for separate/future retrieval flows and excluded from current message endpoints/UI

## Deliverables

- Execution order file
- Thirteen numbered implementation plan files
- Copy-paste execution prompts for sequential implementation

## Plan Files

Canonical contract baseline (completed):

- `.llm/plans/completed/mb1-rss-rollout/01-MB1-SPEC-CONTRACT.md`

Active rollout files:

1. `02-DATA-MODEL-AND-MIGRATIONS.md`
2. `03-MINIMAL-RSS-PARSER-PACKAGE.md`
3. `04-API-BUCKET-CREATION-RSS-CHANNEL-GROUP.md`
4. `05-API-RSS-VERIFY-AND-SYNC-ITEM-BUCKETS.md`
5. `06-API-BOOST-MB1-INGEST-AND-CONFIRM.md`
6. `07-API-PUBLIC-MESSAGES-ENDPOINTS.md`
7. `08-WEB-BUCKET-CREATION-AND-RSS-TABS.md`
8. `09-WEB-RSS-VERIFICATION-AND-MESSAGE-FILTERING.md`
9. `10-PODVERSE-PUBLIC-RSS-ASSET.md`
10. `11-TESTS-AND-DOCS-CHECKLIST.md`
11. `12-TEST-FILE-MAPPING-AND-MATRIX.md`
12. `13-WEB-PUBLIC-HOW-TO-PAGES.md`

## Definition Of Done

- Bucket creation supports Group and RSS Channel as specified.
- RSS verification/sync persists parse and verification metadata.
- mb1 ingest and payment confirmation endpoints enforce schema and clear errors.
- mb1 ingest handles `action='boost' | 'stream'` with explicit behavior:
  - boost: display-intended message flow
  - stream: telemetry-intended flow excluded from current message surfaces
- RSS item sub-buckets are created/updated/orphaned from feed parsing.
- Web surfaces Add to RSS flows and owner/admin unverified toggle behavior.
- API and browser test matrices map each required scenario to concrete test files.
- Public how-to pages are accessible without auth and remain concise for each audience.
- Public message endpoints and capability metadata match docs.
- Podverse feed asset is available from stable public URL.
