---
name: argocd-gitops-push
description: When adding or changing files under infra/k8s/ or sync targets for k8s, know what Argo CD syncs and remind the user to push to Git so the cluster can sync.
---

# Argo CD / GitOps push awareness

## When to use

When adding or changing files under:

- `infra/k8s/` (local, base, or app-of-apps manifests and referenced resources),
- Or any path that is part of an Argo CD Application source (e.g. `infra/k8s/local/apps`, `infra/k8s/local/stack`, `infra/k8s/base/stack`, postgres-init under base, and files referenced by those via Kustomize),
- Or canonical combined schema under k8s base/db (e.g. `infra/k8s/base/db/postgres-init/0003_app_schema.sql` and `0005_management_schema.sql.frag`).

## What Argo CD syncs

- The local app points at repo path `infra/k8s/local/apps` (see `infra/k8s/local-application.yaml`), which references `infra/k8s/local/stack` and the base stack.
- Only the **remote** Git repo at the configured revision (e.g. `develop`) is used; the agent does not push. The user must push for Argo CD to see changes.

## When a push is required

Any change to files under those paths (or to canonical sources that get copied into them) means the cluster will not reflect the change until the user pushes to the branch Argo CD tracks.

## Response requirement

When your file-modifying work touches any of these paths, add a short **Push to Git** note in the response (e.g. before or after the verification block):

**Push to Git:** This change affects Argo CD–synced manifests. Push to the branch Argo CD tracks (e.g. `develop`) for the cluster to sync.

## Version updates (GitOps)

- **Manifest changes** (image tags, env, resources, new deployments): Updating the manifest is the change; push is required for Argo CD (covered by the response reminder above).
- **npm/package versions:** Follow the existing AGENTS.md Dependencies section; no separate version rule for GitOps.

## See also

- [infra/k8s/INFRA-K8S.md](infra/k8s/INFRA-K8S.md) – k8s layout and local app-of-apps.
- [docs/development/K3D-ARGOCD-LOCAL.md](docs/development/K3D-ARGOCD-LOCAL.md) – Local k3d + Argo CD setup.
