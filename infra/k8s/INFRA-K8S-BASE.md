# Per-component Kustomize bases (remote GitOps)

These directories under `infra/k8s/base/` are **shared** workload definitions for Argo CD / Kustomize
overlays (e.g. in **k.podcastdj.com** `apps/metaboost-alpha/<component>/`). Overlays reference a
remote module (HTTPS URL with **`//`** before the in-repo path; same form as
[REMOTE-K8S-GITOPS.md](../../docs/development/k8s/REMOTE-K8S-GITOPS.md) Step 4):

`https://github.com/<org>/metaboost//infra/k8s/base/<component>?ref=<branch-or-tag>`

Use `kubectl kustomize --load-restrictor LoadRestrictionsNone` when building overlays that pull
remote bases.

## Layout

| Directory              | Workloads / resources                                               |
| ---------------------- | ------------------------------------------------------------------- |
| `base/api/`            | ConfigMap stub, Service `api`, Deployment `api`                     |
| `base/web/`            | Sidecar ConfigMap stub, Services + Deployments `web`, `web-sidecar` |
| `base/management-api/` | ConfigMap stub, Service, Deployment                                 |
| `base/management-web/` | Sidecar ConfigMap stub, Services + Deployments                      |
| `base/db/`             | PVC, Service `postgres`, Deployment `postgres`                      |
| `base/keyvaldb/`       | PVC, Service `valkey`, Deployment `valkey`                          |

**ConfigMap stubs** use `data: {}` so `kubectl kustomize` on a base alone succeeds. GitOps
overlays replace real keys in the external GitOps repository.

**Secrets** are not in this repo: encrypted Secret manifests (`metaboost-db-secrets`, etc.) are
maintained in the external GitOps repository.

**Listen ports** in bases are defaults; tune Service/Deployment/Ingress port patches directly in
the external GitOps repository when environment-specific values differ.

**Local k3d** still uses `base/stack/` (see [INFRA-K8S.md](INFRA-K8S.md)); composing local from
these bases is deferred (plan `metaboost-k8s-gitops-alignment`).

## Verify locally

From monorepo root (with kubectl on PATH):

```bash
for d in api web management-api management-web db keyvaldb; do
  kubectl kustomize "infra/k8s/base/$d" --load-restrictor LoadRestrictionsNone >/dev/null \
    && echo "ok base/$d" || echo "FAIL base/$d"
done
```
