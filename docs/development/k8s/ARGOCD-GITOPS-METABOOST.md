# Argo CD and Metaboost (alpha app-of-apps + GitOps consumption)

This repository ships **Kustomize bases** under `infra/k8s/base/<component>/`, **local** k3d
scaffold under `infra/k8s/local/`, **in-repo alpha app-of-apps** manifests under `infra/k8s/alpha*`,
and remote deployment guidance.

## In-repo alpha app-of-apps

Alpha root and child Argo CD Applications are first-class and live in this repository:

- Root app: `infra/k8s/alpha-application.yaml`
- Child apps: `infra/k8s/alpha/apps/*.yaml`
- Child sources: `infra/k8s/alpha/<component>/`

This model can be applied directly, or consumed from an external GitOps repository that tracks this
repo path and revision.

## Where production and environment orchestration lives

For **remote** clusters, treat your **GitOps repository** as the source of truth for
source of truth for:

- Argo CD **`AppProject`** CRs and environment orchestration,
- per-environment **Kustomize overlays** (`apps/metaboost-<env>/`),
- **SOPS-encrypted** secrets committed to Git.

One reference GitOps repo is **k.podcastdj.com** (private org layout); forks should mirror
that pattern under their own repo. Argo CD’s **`targetRevision`** typically tracks **one** default branch
(e.g. **`main`**); **alpha / beta / prod** are separate **paths** (`apps/metaboost-<env>/`), not separate
Git branches on the GitOps repo.

The in-repo alpha root `Application` can be used directly. For broader environment orchestration,
operators still typically register Argo CD resources from their GitOps repository.

## Staging-branch publish: staging tags and Argo CD refs

The **Publish (staging)** workflow (`.github/workflows/publish-staging.yml`, triggered on
push to **`staging`**) pushes Docker images as SemVer pre-releases **`X.Y.Z-staging.N`** and a floating
**`:staging`** tag. After GHCR verification it creates a **Git tag** with the same name as the
version tag on the workflow commit. Point Kustomize remote bases (`?ref=`) or Argo CD
`source.targetRevision` at that tag when syncing paths **in this repository** so bases match the
image tag. Non-prod and prod clusters use different **GitOps** overlay pins. Update those pins in your GitOps repository after each publish (this app repo does not
push GitOps commits from CI). The **`staging`** in **`X.Y.Z-staging.N`** names the **pre-release image
tag**, not a required Kubernetes environment name—your overlays can still be named **`metaboost-alpha`**, etc.

## External GitOps consumption

If your organization manages Argo resources from a separate GitOps repository, consume the in-repo
alpha model by pointing Argo CD at this repository's `infra/k8s/alpha-application.yaml` and
`infra/k8s/alpha/apps/` at the chosen revision.

## Related

- [METABOOST-PUBLISH-GITOPS-BUMP-CHECKLIST.md](../release/METABOOST-PUBLISH-GITOPS-BUMP-CHECKLIST.md) — overlay files to bump after publish.
- [REMOTE-K8S-GITOPS.md](REMOTE-K8S-GITOPS.md) — clone, render, SOPS, sync order.
- [GITOPS-CUTOVER-STAGING-CHECKLIST.md](GITOPS-CUTOVER-STAGING-CHECKLIST.md) — staging rollout steps.
- [GITOPS-FUTURE-ENVIRONMENTS.md](GITOPS-FUTURE-ENVIRONMENTS.md) — **future** beta/prod GitOps and
  promotion notes (not implemented; for when that work is scheduled).
- [infra/k8s/INFRA-K8S.md](../../../infra/k8s/INFRA-K8S.md) — layout of `base/`, `local/`, `alpha/`.
