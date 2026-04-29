# K8s env

Metaboost no longer maintains an in-repo K8s env render/contract/drift pipeline.

Recommended model:

- Keep canonical local env templates/examples in this repo under `infra/config/env-templates/` and `apps/*/.env.example`.
- Maintain remote K8s env files and generated K8s manifests in your GitOps repository.
- Keep Argo CD overlays and deployment-specific values in that GitOps repository.

See `docs/development/k8s/REMOTE-K8S-GITOPS.md` for the current remote deployment flow.
