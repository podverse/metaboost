# K8S env render (deprecated)

Metaboost no longer maintains an in-repo K8s env contract/render/drift pipeline.

Recommended approach:

- Keep local env templates/examples in this repository.
- Maintain remote K8s env files, generated manifests, and environment-specific patches in your GitOps repository.
- Keep Argo CD overlays and encrypted secrets in your GitOps repository.

Use [REMOTE-K8S-GITOPS.md](REMOTE-K8S-GITOPS.md) as the active runbook.
