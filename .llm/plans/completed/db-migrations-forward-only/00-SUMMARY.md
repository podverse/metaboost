# Metaboost DB migrations - forward-only summary

## Goal

Standardize Metaboost on an additive forward-only migration model that supports:

- **fresh bootstrap** to latest schema on first DB startup;
- **existing DB upgrades** through repeatable linear migration runs;
- **K8s operations** through `metaboost-ops` idempotent one-off jobs;
- **monorepo-only scope** for base/alpha and related files (no external GitOps repo implementation in this plan set).

## Plan files

- `00-EXECUTION-ORDER.md`
- `01-canonical-linear-migration-contract.md` (completed at `.llm/plans/completed/db-migrations-forward-only/01-canonical-linear-migration-contract.md`)
- `02-linear-scripts-ci-and-make-cutover.md` (completed at `.llm/plans/completed/db-migrations-forward-only/02-linear-scripts-ci-and-make-cutover.md`)
- `03-metaboost-ops-k8s-jobs-and-cache-safety.md` (completed at `.llm/plans/completed/db-migrations-forward-only/03-metaboost-ops-k8s-jobs-and-cache-safety.md`)
- `04-docs-runbooks-and-legacy-reference-removal.md` (completed at `.llm/plans/completed/db-migrations-forward-only/04-docs-runbooks-and-legacy-reference-removal.md`)
- `COPY-PASTA.md`

## Scope decisions

- Keep canonical bootstrap SQL under `infra/k8s/base/db/postgres-init/` for initial database initialization.
- Add explicit linear migration directories for app and management schemas (forward-only additive files).
- Add/standardize migration metadata table + locking/checksum behavior for idempotent upgrades.
- Add `metaboost-ops` manifests under monorepo `infra/k8s/base` and `infra/k8s/alpha` structures.
- Remove active references to previous non-linear migration naming in scripts/docs/CI.

## Explicitly out of scope

- Updating any external environment-specific GitOps repository.
- Domain-specific deployment rollout steps.
- Multi-branch release orchestration outside this monorepo.

## Success criteria

- New schema changes are delivered as linear migration files, not by rebuilding a monolithic init artifact workflow.
- Fresh DB init path still lands at current schema for app and management DBs.
- Existing DBs can be safely upgraded with idempotent linear migration jobs.
- `metaboost-ops` one-off jobs exist for app and management migrations with cache-staleness protections.
- Documentation, Makefiles, and CI reflect only the forward-only workflow.
