# Phase 3 - Metaboost ops K8s jobs and cache safety

## Scope

Add `metaboost-ops` one-off migration jobs in monorepo K8s base/alpha scaffolding with idempotent behavior and anti-staleness protections.

## Key files

- `infra/k8s/base/ops/kustomization.yaml` (new)
- `infra/k8s/base/ops/db-migrate-app.cronjob.yaml` (new)
- `infra/k8s/base/ops/db-migrate-management.cronjob.yaml` (new)
- `infra/k8s/alpha/ops/kustomization.yaml` (new, if alpha ops overlay does not exist yet)
- `infra/k8s/alpha/apps/metaboost-ops.application.yaml` (new application scaffold for `metaboost-ops`)
- `infra/k8s/INFRA-K8S.md`
- `infra/k8s/base/db/kustomization.yaml`
- `infra/k8s/base/stack/kustomization.yaml`

## Steps

1. **Create base ops resources**
   - Add suspended one-off CronJobs (manual trigger pattern) for app + management migration runs.
   - Job command should invoke linear migration runner with target DB argument.
   - Use existing DB secret keys with explicit env wiring.

2. **Add alpha ops application setup**
   - Create alpha ops overlay + app manifest in this monorepo for `metaboost-ops`.
   - Keep this as in-repo scaffolding only; do not modify external GitOps repo in this plan set.

3. **Protect against stale SQL/script execution**
   - Ensure job pods pick up latest migration assets:
     - use immutable image tags/digests whenever possible;
     - set `imagePullPolicy: Always` when mutable tags are used;
     - add migration bundle checksum annotation/env to force pod template changes when SQL/scripts change.
   - Reassess `disableNameSuffixHash: true` usage for migration-critical ConfigMaps used by jobs.

4. **Idempotency and observability**
   - Job reruns should safely no-op when no pending migrations remain.
   - Job logs should clearly report applied vs skipped migrations and terminal status.

## Verification

- Base/alpha ops manifests build successfully in-repo.
- Manual trigger of each migration job applies pending migrations once and exits successfully on repeat runs.
- Updating migration SQL/scripts changes job input version signal (image digest and/or checksum annotation), preventing stale execution.
