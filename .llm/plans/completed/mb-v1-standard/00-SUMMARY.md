# mb-v1 / Custom buckets — plan set summary

## Scope

- New MetaBoost standard `mb-v1` (non-RSS ingest) under `/v1/standard/mb-v1/`.
- Bucket types `mb-root`, `mb-mid`, `mb-leaf` (3 levels); disjoint from `rss-*` trees.
- Web: Custom top-level option, Endpoint tab, child creation for mb hierarchy only.

## Plan files

| File | Topic |
|------|--------|
| 01-schema-migrations-orm.md | DB + ORM + helpers-requests |
| 02-api-standard-mb-v1-and-refactor.md | Controller, OpenAPI, shared ingest |
| 03-buckets-child-create-and-policy.md | Create API, cross-family rules |
| 04-web-ui-endpoint-tab.md | BucketForm, tabs, i18n |
| 05-tests-e2e-management.md | API tests, E2E, management |
| 06-podverse-v4v-metaboost.md | Podverse package + web boost |

## Completion note

Implementation phases 01, 02, 03, 04, and 06 were completed from this set.
Remaining test-hardening scope from `05-tests-e2e-management.md` was consolidated into:

- `.llm/plans/active/mb-v1-gap-closure/`

See `00-EXECUTION-ORDER.md` for original sequencing.
