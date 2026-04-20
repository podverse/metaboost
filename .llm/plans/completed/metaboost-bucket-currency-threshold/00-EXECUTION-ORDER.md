# Metaboost Bucket Currency Threshold - Execution Order

This plan set replaces the USD-bound threshold approach with bucket-preferred currency rules,
adds conversion APIs/pages to Metaboost, and updates Podverse donate UX accordingly.

## Phase 1 (sequential)
1. `01-domain-model-and-schema.md`
2. `02-bucket-settings-api-and-cascade.md`

## Phase 2 (sequential)
1. `03-conversion-service-and-currency-catalog.md`
2. `04-public-conversion-endpoint-and-bucket-response-url.md`

## Phase 3 (sequential)
1. `09-threshold-filter-sql-path-and-query-rename.md`
2. `10-legacy-row-behavior-and-contract-clarity.md`

## Phase 4 (parallel after Phase 3)
1. `05-metaboost-web-exchange-rates-page.md`
2. `.llm/plans/completed/metaboost-bucket-currency-threshold/06-podverse-threshold-conversion-ux/06a-podverse-metaboost-bucket-context-plumbing.md` (completed)
3. `.llm/plans/completed/metaboost-bucket-currency-threshold/06-podverse-threshold-conversion-ux/06b-podverse-conversion-request-plumbing.md` (completed; run after `06a`)
4. `.llm/plans/completed/metaboost-bucket-currency-threshold/06-podverse-threshold-conversion-ux/06c-podverse-threshold-gating-donate-form.md` (completed; run after `06b`)
5. `.llm/plans/completed/metaboost-bucket-currency-threshold/06-podverse-threshold-conversion-ux/06d-podverse-threshold-gating-podcast-episode-forms.md` (completed; run after `06c`)
6. `.llm/plans/completed/metaboost-bucket-currency-threshold/06-podverse-threshold-conversion-ux/06e-podverse-threshold-error-handling-and-i18n.md` (completed; run after `06d`)
7. `.llm/plans/completed/metaboost-bucket-currency-threshold/11-podverse-boost-form-currency-input-formatting.md` (completed; run after `06e`)
8. `.llm/plans/completed/metaboost-bucket-currency-threshold/12-podverse-boost-form-currency-input-integration.md` (completed; run after `11`)
9. `.llm/plans/completed/metaboost-bucket-currency-threshold/13-podverse-boost-form-currency-input-validation-and-e2e.md` (completed; run after `12`)

## Phase 5 (sequential)
1. `.llm/plans/completed/metaboost-bucket-currency-threshold/07-openapi-docs-env-and-k8s.md` (completed)
2. `.llm/plans/completed/metaboost-bucket-currency-threshold/08-test-plan.md` (completed)

## Dependency Notes
- `02` depends on schema/contracts from `01`.
- `03` must land before endpoint wiring in `04`.
- `09` depends on runtime behavior introduced by `04`.
- `10` depends on contract/runtime decisions finalized in `09`.
- `05` depends on API surface from `04` and contract stability from `09`/`10`.
- `06a` depends on bucket response and conversion endpoint from `04`, plus finalized list-threshold query contract from `09`/`10`.
- `06b` depends on bucket context/output contracts from `06a`.
- `06c` depends on conversion helper/plumbing from `06b`.
- `06d` depends on donate-form threshold pattern from `06c` and applies parity across all Metaboost-enabled v4v forms.
- `06e` depends on threshold behavior being integrated across donate + podcast + episode flows (`06c`/`06d`) before finalizing deterministic errors and i18n.
- `11` depends on threshold/conversion wiring from `06e` so display formatting/parsing and threshold comparisons use one normalized amount pipeline.
- `12` depends on utility contract from `11` and applies it across all Podverse boost form surfaces.
- `13` depends on integrated behavior from `12` and finalizes validation/i18n/E2E matrix.
- `07` depends on finalized API/UX behavior from `02` through `06e`, including hardening updates from `09`/`10`.
- `07` should also include any env/docs updates introduced by `11` to `13` if shared formatting config is added.
- `08` validates all prior phases end-to-end.
