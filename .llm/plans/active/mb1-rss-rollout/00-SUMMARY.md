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

## Deliverables

- Execution order file
- Thirteen numbered implementation plan files
- Copy-paste execution prompts for sequential implementation

## Plan Files

1. `01-MB1-SPEC-CONTRACT.md`
2. `02-DATA-MODEL-AND-MIGRATIONS.md`
3. `03-MINIMAL-RSS-PARSER-PACKAGE.md`
4. `04-API-BUCKET-CREATION-RSS-CHANNEL-GROUP.md`
5. `05-API-RSS-VERIFY-AND-SYNC-ITEM-BUCKETS.md`
6. `06-API-BOOST-MB1-INGEST-AND-CONFIRM.md`
7. `07-API-PUBLIC-MESSAGES-ENDPOINTS.md`
8. `08-WEB-BUCKET-CREATION-AND-RSS-TABS.md`
9. `09-WEB-RSS-VERIFICATION-AND-MESSAGE-FILTERING.md`
10. `10-PODVERSE-PUBLIC-RSS-ASSET.md`
11. `11-TESTS-AND-DOCS-CHECKLIST.md`
12. `12-TEST-FILE-MAPPING-AND-MATRIX.md`
13. `13-WEB-PUBLIC-HOW-TO-PAGES.md`

## Definition Of Done

- Bucket creation supports Group and RSS Channel as specified.
- RSS verification/sync persists parse and verification metadata.
- mb1 ingest and payment confirmation endpoints enforce schema and clear errors.
- RSS item sub-buckets are created/updated/orphaned from feed parsing.
- Web surfaces Add to RSS flows and owner/admin unverified toggle behavior.
- API and browser test matrices map each required scenario to concrete test files.
- Public how-to pages are accessible without auth and remain concise for each audience.
- Public message endpoints and capability metadata match docs.
- Podverse feed asset is available from stable public URL.
