# Per-component Kustomize bases (remote GitOps)

These directories under `infra/k8s/base/` are **shared** workload definitions for Argo CD / Kustomize
overlays (e.g. your GitOps repo’s `apps/metaboost-alpha/<component>/`). Overlays reference a
remote module (HTTPS URL with **`//`** before the in-repo path; same form as
[REMOTE-K8S-GITOPS.md](../../docs/development/k8s/REMOTE-K8S-GITOPS.md) Step 4):

`https://github.com/<org>/metaboost//infra/k8s/base/<component>?ref=<branch-or-tag>`

Use `kubectl kustomize --load-restrictor LoadRestrictionsNone` when building overlays that pull
remote bases.

## Layout

| Directory              | Workloads / resources                                                                                                                                     |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `base/api/`            | **configMapGenerator** `metaboost-api-config` from `source/api.env`, Service `api`, Deployment `api`                                                      |
| `base/web/`            | ConfigMaps from `source/web.env` + `source/web-sidecar.env`, Service `web`, Deployment `web` (web + sidecar containers, Podverse-style)                   |
| `base/management-api/` | **configMapGenerator** `metaboost-management-api-config` from `source/management-api.env`, Service, Deployment                                            |
| `base/management-web/` | ConfigMaps from `source/management-web.env` + `source/management-web-sidecar.env`, Service `management-web`, Deployment `management-web` (dual container) |
| `base/db/`             | Service `metaboost-db`, StatefulSet `metaboost-db` (+ generated PVC via `volumeClaimTemplates`)                                                           |
| `base/keyvaldb/`       | PVC `metaboost-valkey-data`, Service `metaboost-keyvaldb`, Deployment `valkey`                                                                            |

**ConfigMap defaults** live under `infra/k8s/base/*/source/*.env` (kustomize **env file** semantics:
prefer **unquoted** values so generated `ConfigMap.data` does not embed stray quote characters).
Canonical non-K8s templates remain [`infra/config/env-templates/*.env.example`](../../infra/config/env-templates/api.env.example); keep keys aligned when changing startup requirements.

**GitOps overlays** should use **`configMapGenerator` with `behavior: merge`** and thin `source/*.env` fragments layered on these bases.

**Secrets** are not in this repo: encrypted Secret manifests (`metaboost-db-secrets`, etc.) are
maintained in the external GitOps repository. **Base Deployments** still reference the Secret
names (and optional mailer secret) so runtime env wiring matches GitOps; only the secret _payloads_
live out of band.

**Listen ports** in bases are defaults; tune Service/Deployment/Ingress port patches directly in
the external GitOps repository when environment-specific values differ.

## Verify locally

From monorepo root (with kubectl on PATH):

```bash
./scripts/k8s/kustomize-build-metaboost-bases.sh
```

Or manually:

```bash
for d in api web management-api management-web db keyvaldb ops; do
  kubectl kustomize "infra/k8s/base/$d" --load-restrictor LoadRestrictionsNone >/dev/null \
    && echo "ok base/$d" || echo "FAIL base/$d"
done
```
