# Bucket Message USD Threshold - Execution Order

This plan set defines how to implement USD-cents threshold filtering for bucket messages.

## Phase 1 (sequential)
1. `01-schema-and-orm.md`
2. `02-create-time-usd-conversion.md`

## Phase 2 (sequential)
1. `03-list-filtering-api-and-standard-endpoints.md`
2. `04-bucket-settings-ui-and-types.md`

## Phase 3 (sequential)
1. `05-openapi-and-docs.md`
2. `06-test-plan.md`

## Dependency Notes
- `02` depends on new ORM/schema fields from `01`.
- `03` depends on `01` and `02` (query basis column must exist/populate).
- `04` depends on `01` (settings field and API contracts available).
- `05` depends on API contract stabilization from `03` and `04`.
- `06` depends on all prior plans and validates end-to-end behavior.
