# Argo CD Sync-Wave Contract (Metaboost)

This contract standardizes **Application** sync ordering in GitOps repositories.

## Ownership

- Live `Application` manifests stay in GitOps repos.
- Metaboost defines the canonical wave contract and validation logic.

## Canonical order

- `common`: `-3`
- `db`: `-2`
- `keyvaldb`: `-2`
- `ops`: `-1`
- `api`: `0`
- `management-api`: `0`
- `web`: `1`
- `management-web`: `1`

## Why

- Base infrastructure and namespace objects converge first.
- Data stores converge before workloads.
- Migration/ops jobs settle before API rollout.
- API availability gates web rollout.

## References

- Example files: `infra/k8s/argocd/examples/metaboost-alpha/*.yaml`
- Contract checker: `infra/k8s/scripts/check_argocd_app_contract.sh`
- Remote GitOps runbook: `docs/development/k8s/REMOTE-K8S-GITOPS.md`
