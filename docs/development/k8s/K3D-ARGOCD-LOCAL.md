# Local k3d (removed)

The in-repo **k3d + local Argo CD** workflow has been removed. Use **Docker Compose** for local development ([QUICK-START.md](../../QUICK-START.md), [LOCAL-ENV-OVERRIDES.md](../env/LOCAL-ENV-OVERRIDES.md)) and a **remote cluster + GitOps** for Kubernetes validation ([REMOTE-K8S-GITOPS.md](REMOTE-K8S-GITOPS.md), [ARGOCD-GITOPS-METABOOST.md](ARGOCD-GITOPS-METABOOST.md)).

**Postgres password drift** on a remote cluster: see [REMOTE-K8S-POSTGRES-REINIT.md](REMOTE-K8S-POSTGRES-REINIT.md).
