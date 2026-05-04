---
name: migration-readiness-marker-sync
description: Keep K8s readiness migration marker env vars aligned with latest linear SQL migrations. Use when adding/changing linear migrations or readiness init checks.
---


# Migration Readiness Marker Sync (Metaboost)

Use this skill whenever you touch:

- `infra/k8s/base/ops/source/database/linear-migrations/**`
- API or management-api migration wait initContainers
- API or management-api K8s `source/*.env` files containing readiness migration marker vars

## Goal

Ensure startup readiness gates verify the correct latest migration marker for each DB domain.

## Required alignment

When new latest migrations are added:

1. Update marker env defaults:
   - `infra/k8s/base/api/source/api.env`:
     - `API_EXPECTED_MIGRATION_FILENAME`
   - `infra/k8s/base/management-api/source/management-api.env`:
     - `MANAGEMENT_API_EXPECTED_MIGRATION_FILENAME`
2. Verify initContainer SQL checks in:
   - `infra/k8s/base/api/deployment.yaml`
   - `infra/k8s/base/management-api/deployment.yaml`
     They must read marker env vars and not stale hardcoded filenames.
3. Keep Kustomize configMap wiring in sync so the updated values reach pods.

## Migration source of truth

Use latest SQL filenames under:

- `infra/k8s/base/ops/source/database/linear-migrations/app/`
- `infra/k8s/base/ops/source/database/linear-migrations/management/`

If a migration becomes a startup prerequisite, update marker env values in the same PR.

## Verification checklist

- `kustomize build --load-restrictor LoadRestrictionsNone infra/k8s/base/api`
- `kustomize build --load-restrictor LoadRestrictionsNone infra/k8s/base/management-api`
- Confirm rendered initContainer SQL checks reference updated marker env vars.
