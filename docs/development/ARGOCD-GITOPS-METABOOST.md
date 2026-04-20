# Argo CD and Metaboost (canonical GitOps story)

This repository ships **Kustomize bases** under `infra/k8s/base/<component>/`, **local** k3d
scaffold under `infra/k8s/local/`, and **env render** tooling (`make alpha_env_render`, …). It
does **not** ship the Argo CD `Application` manifests that sync non-local environments to a
cluster.

## Where production Applications live

For **remote** clusters (alpha, beta, production), treat your **GitOps repository** as the only
source of truth for:

- Argo CD **`Application`** and **`AppProject`** CRs (paths such as `argocd/metaboost-<env>/`),
- per-environment **Kustomize overlays** (`apps/metaboost-<env>/`),
- **SOPS-encrypted** secrets committed to Git.

The Podverse reference GitOps repo is **k.podcastdj.com** (private org layout); forks should mirror
that pattern under their own repo. Argo CD’s **`targetRevision`** typically tracks **one** default branch
(e.g. **`main`**); **alpha / beta / prod** are separate **paths** (`apps/metaboost-<env>/`), not separate
Git branches on the GitOps repo.

**Do not** `kubectl apply` a root `Application` from this monorepo expecting it to drive alpha, beta,
or production: Argo CD **`Application`** and **`AppProject`** CRs for remote environments live in your
**GitOps repository**. This repo ships Kustomize bases, local k3d scaffolding under `infra/k8s/local/`,
and env render tooling only.

## Alpha branch publish: staging tags and Argo CD refs

The **Publish staging (alpha branch)** workflow (`.github/workflows/publish-alpha.yml`, triggered on
push to **`alpha`**) pushes Docker images as SemVer pre-releases **`X.Y.Z-staging.N`** and a floating
**`:staging`** tag. After GHCR verification it creates a **Git tag** with the same name as the
version tag on the workflow commit. Point Kustomize remote bases (`?ref=`) or Argo CD
`source.targetRevision` at that tag when syncing paths **in this repository** so bases match the
image tag. Alpha and beta clusters can share the same image stream; pins differ in **GitOps**
overlays. Update those pins in your GitOps repository after each publish (this app repo does not
push GitOps commits from CI). The **`staging`** in **`X.Y.Z-staging.N`** names the **pre-release image
tag**, not a required Kubernetes environment name—your overlays stay **`metaboost-alpha`**, **`metaboost-beta`**, etc.

## Optional: app-of-apps from this repo

If your org wants a Metaboost-hosted app-of-apps, add real `Application` YAML under
`infra/k8s/alpha/apps/` (or another path), wire a new root `Application` deliberately, and document
the branch Argo CD should track. The open-source default is **GitOps-repo-only** Applications, as
described in [REMOTE-K8S-GITOPS.md](REMOTE-K8S-GITOPS.md).

## Related

- [METABOOST-PUBLISH-GITOPS-BUMP-CHECKLIST.md](METABOOST-PUBLISH-GITOPS-BUMP-CHECKLIST.md) — overlay files to bump after publish.
- [REMOTE-K8S-GITOPS.md](REMOTE-K8S-GITOPS.md) — clone, render, SOPS, sync order.
- [GITOPS-CUTOVER-STAGING-CHECKLIST.md](GITOPS-CUTOVER-STAGING-CHECKLIST.md) — staging rollout steps.
- [GITOPS-FUTURE-ENVIRONMENTS.md](GITOPS-FUTURE-ENVIRONMENTS.md) — **future** beta/prod GitOps and
  promotion notes (not implemented; for when that work is scheduled).
- [infra/k8s/INFRA-K8S.md](../../infra/k8s/INFRA-K8S.md) — layout of `base/`, `local/`, `alpha/`.
