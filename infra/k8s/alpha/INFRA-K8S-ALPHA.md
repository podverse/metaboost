# Alpha overlay scaffold

This directory is intentionally **scaffold-only**. There is **no** working Argo CD app-of-apps tree
here; canonical **`Application`** CRs for remote alpha live in your **GitOps** repository (see
[`docs/development/ARGOCD-GITOPS-BOILERPLATE.md`](../../../docs/development/ARGOCD-GITOPS-BOILERPLATE.md)).

- Local deployment should use `infra/k8s/local/*`.
- Remote alpha overlays and rendered env live in the GitOps repo; `make alpha_env_render` writes into
  `BOILERPLATE_K8S_OUTPUT_REPO`.
- Keep environment manifests separate from `local` from day one.
