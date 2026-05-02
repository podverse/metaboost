# K8s Base Structure Reference Alignment Checklist (06a)

Date: 2026-04-28
Phase: 06a-k8s-base-structure-parity

## Scope

- Base component kustomization structure under `infra/k8s/base/*`.
- Workload grouping and config patch integration points for api/web/management-api/management-web.
- Aggregate **base** verification via `./scripts/k8s/kustomize-build-metaboost-bases.sh` (or per-component `kubectl kustomize infra/k8s/base/<component>`).

## Checklist

- [x] Base component kustomizations expose canonical ConfigMap names via **`configMapGenerator`** + `infra/k8s/base/*/source/*.env` defaults (merge targets for GitOps overlays — replaces legacy empty ConfigMap YAML stubs).
- [x] Base deployments are wired to the canonical non-secret ConfigMap names used by generated env flows:
  - `metaboost-api-config`
  - `metaboost-web-config`
  - `metaboost-web-runtime-config`
  - `metaboost-management-api-config`
  - `metaboost-management-web-config`
  - `metaboost-management-web-runtime-config`
- [x] Scripted base build check succeeds via `./scripts/k8s/kustomize-build-metaboost-bases.sh`.
- [x] Per-component base builds succeed for `api`, `web`, `management-api`, `management-web`, `db`, and `keyvaldb`.

## Intentional Divergences

- Metaboost does not add optional base components outside the current product scope in this phase (`workers`, `mq`, `cron`, `common`, `management-db`).
- Metaboost keeps `db` as a Deployment + PVC model in this phase (alternatives such as StatefulSet are out of scope here).
