---
name: argocd-gitops-push
description: When adding or changing files under infra/k8s/ or sync targets for k8s, know what Argo CD syncs and remind the user to push to Git so the cluster can sync.
---

# Argo CD / GitOps push awareness

## When to use

When adding or changing files under:

- **`infra/k8s/base/`** – reusable Kustomize bases per component (referenced by alpha overlays and/or your GitOps repo),
- **`infra/k8s/alpha/`** – in-repo alpha app-of-apps and child overlays,
- **`infra/k8s/argocd/`** – optional project manifests committed here,
- Any path that is part of an **Argo CD Application** source in **your GitOps repository** (paths vary by installation),
- **Canonical linear migration SQL** under `infra/k8s/base/ops/source/database/linear-migrations/{app,management}/`,
- **Ops** manifests under `infra/k8s/base/ops/` (migration CronJobs, mounted scripts, `kustomization.yaml` entries).

## What Argo CD syncs

- **Alpha:** Root **`infra/k8s/alpha-application.yaml`** (when applied) points at **`infra/k8s/alpha/apps`**, which references **`infra/k8s/alpha/<component>/`** overlays.
- **Remote environments:** Application CRs usually live in your **GitOps repo** and reference paths/branches you configure (see [docs/development/k8s/REMOTE-K8S-GITOPS.md](../../../docs/development/k8s/REMOTE-K8S-GITOPS.md)).
- Only the **remote** Git revision Argo CD tracks is authoritative; the agent does not push.

## When a push is required

Any change to synced paths (or canonical sources copied into them) is invisible to the cluster until those commits are on the branch Argo CD watches (**often `develop` / `main` on the GitOps repo**).

## Response requirement

When file-modifying work touches **`infra/k8s/`** or migration SQL under **`infra/k8s/base/ops/`**, add a short **Push to Git** note:

**Push to Git:** This change affects Argo CD–synced manifests. Push to the branch Argo CD tracks so the cluster can sync.

## Version updates (GitOps)

- **Manifest changes** (image tags, env, resources): push so Argo CD picks them up.
- **npm/package versions:** Follow AGENTS.md Dependencies; no separate GitOps-only rule.

## See also

- [infra/k8s/INFRA-K8S.md](../../../infra/k8s/INFRA-K8S.md) – layout and consumption.
- [docs/development/k8s/REMOTE-K8S-GITOPS.md](../../../docs/development/k8s/REMOTE-K8S-GITOPS.md) – remote cluster workflow.
- [docs/development/k8s/K3D-ARGOCD-LOCAL.md](../../../docs/development/k8s/K3D-ARGOCD-LOCAL.md) – stub (local k3d removed).
