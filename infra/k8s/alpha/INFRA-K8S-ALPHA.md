# Alpha overlay scaffold

This directory is intentionally **scaffold-only**. Canonical **`Application`** CRs for remote alpha
live in your **GitOps** repository (see
[`docs/development/k8s/ARGOCD-GITOPS-METABOOST.md`](../../../docs/development/k8s/ARGOCD-GITOPS-METABOOST.md)).

- Local deployment should use `infra/k8s/local/*`.
- Remote alpha overlays and rendered env live in the GitOps repo; `make alpha_env_render` writes into
  `METABOOST_K8S_OUTPUT_REPO`.
- `apps/metaboost-alpha-ops.application.yaml` and `ops/kustomization.yaml` are in-repo scaffolds for the Argo `Application` `metaboost-alpha-ops` (base ops ConfigMaps stay `metaboost-ops-*`).
  They are not a replacement for the canonical remote app-of-apps in your GitOps repo.
- Keep environment manifests separate from `local` from day one.
