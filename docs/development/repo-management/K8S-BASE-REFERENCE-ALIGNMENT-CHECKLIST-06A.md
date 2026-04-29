# K8s Base Structure Reference Alignment Checklist (06a)

Date: 2026-04-28
Phase: 06a-k8s-base-structure-parity

## Scope

- Base component kustomization structure under `infra/k8s/base/*`.
- Workload grouping and config patch integration points for api/web/management-api/management-web.
- Base stack kustomize verification.

## Checklist

- [x] Base component kustomizations include explicit ConfigMap stubs for generated env merge points:
  - `infra/k8s/base/api/configmap.yaml`
  - `infra/k8s/base/web/configmap-web.yaml`
  - `infra/k8s/base/web/configmap-web-sidecar.yaml`
  - `infra/k8s/base/management-api/configmap.yaml`
  - `infra/k8s/base/management-web/configmap-management-web.yaml`
  - `infra/k8s/base/management-web/configmap-management-web-sidecar.yaml`
- [x] Base deployments are wired to the canonical non-secret ConfigMap names used by generated env flows:
  - `metaboost-api-config`
  - `metaboost-web-config`
  - `metaboost-web-sidecar-config`
  - `metaboost-management-api-config`
  - `metaboost-management-web-config`
  - `metaboost-management-web-sidecar-config`
- [x] Base stack build succeeds via `kubectl kustomize infra/k8s/base/stack`.
- [x] Per-component base builds succeed for `api`, `web`, `management-api`, `management-web`, `db`, and `keyvaldb`.

## Intentional Divergences

- Metaboost does not add Podverse-only base components in this phase (`workers`, `mq`, `cron`, `common`, `management-db`) because those workloads and contracts are product-specific and out of 06a scope.
- Metaboost keeps `db` as a Deployment + PVC model in this phase; Podverse uses a StatefulSet model.
