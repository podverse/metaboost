# mb-v1 gap closure summary

## Goal

Close the remaining rollout risks after the initial `mb-v1` + Custom bucket implementation by adding missing parity coverage and high-signal tests across API, web E2E, management surfaces, and Podverse.

## Why this plan set exists

The feature implementation is broadly in place, but review found coverage gaps that can allow regressions:

- Missing explicit API matrix tests for `mb-*` hierarchy rules and cross-family rejections.
- Missing standard-endpoint parity tests for `mb-v1` in app-assertion and CORS paths.
- Missing web E2E coverage for Custom create + Endpoint tab + mb child flows.
- Missing management-api / management-web parity checks for `mb-*` type assumptions.
- Missing Podverse unit/integration tests for mb-v1 strategy selection and request builders.

This set also absorbs the unfinished scope from:

- `.llm/plans/completed/mb-v1-standard/05-tests-e2e-management.md`

## Plan files

All numbered phases in this set are completed.

Completed in this set:

- `.llm/plans/completed/mb-v1-gap-closure/01-api-standard-parity-tests.md`
- `.llm/plans/completed/mb-v1-gap-closure/02-api-bucket-policy-matrix-tests.md`
- `.llm/plans/completed/mb-v1-gap-closure/03-web-e2e-custom-endpoint-and-children.md`
- `.llm/plans/completed/mb-v1-gap-closure/04-management-parity-and-regression-guards.md`
- `.llm/plans/completed/mb-v1-gap-closure/05-podverse-mb-v1-tests-and-mint-validation.md`

## Dependencies and order

- Execute in strict order from `00-EXECUTION-ORDER.md`.
- API parity and bucket policy tests come first because later E2E and Podverse work should rely on stable backend guarantees.
- Management and Podverse work can proceed after core API work; Podverse remains last due to cross-repo verification overhead.

## Done criteria

- All new/updated tests pass in targeted runs for each phase.
- No `mb-*` / `rss-*` cross-family policy regressions.
- `mb-v1` routes are covered for HTTPS enforcement, CORS, and app-assertion parity.
- Web UI behavior for Custom buckets and Endpoint tab is covered by E2E.
- Podverse mb-v1 execution path has unit/integration test coverage.
