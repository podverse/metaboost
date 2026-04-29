# Metaboost DB migrations - execution order

## Sequencing rule

Run phases in order. Do not overlap phases unless explicitly marked safe.

## Phase order

1. **Phase 1 - Canonical linear migration contract** (`.llm/plans/completed/db-migrations-forward-only/01-canonical-linear-migration-contract.md`) - COMPLETED
2. **Phase 2 - Scripts, CI, and Makefile cutover** (`.llm/plans/completed/db-migrations-forward-only/02-linear-scripts-ci-and-make-cutover.md`) - COMPLETED
3. **Phase 3 - metaboost-ops K8s jobs and cache safety** (`.llm/plans/completed/db-migrations-forward-only/03-metaboost-ops-k8s-jobs-and-cache-safety.md`) - COMPLETED
4. **Phase 4 - docs and legacy reference cleanup** (`.llm/plans/completed/db-migrations-forward-only/04-docs-runbooks-and-legacy-reference-removal.md`) - COMPLETED

## Parallelization guidance

- Keep phases sequential.
- Within **Phase 4** only, documentation edits and non-overlapping Makefile/help updates may run in parallel.

## Completion gate

- Previous non-linear commands are removed from active usage paths.
- Forward-only migration flow works for app + management databases.
- `metaboost-ops` migration jobs exist in base/alpha monorepo scaffolding and are idempotent.
- No external GitOps repo updates are required to consider this plan set complete.
