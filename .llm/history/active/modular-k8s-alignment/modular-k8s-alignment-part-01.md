# modular-k8s-alignment

Started: 2026-05-01  
Author: assistant  
Context: Podverse-style modular K8s — remove `base/stack`, compose `local/stack` from `base/*`, fold secret wiring into bases; align metaboost.cc overlays.

### Session 1 - 2026-05-01

#### Prompt (Agent)

Modular Metaboost K8s (Podverse-style alignment)

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Canonical **api**, **management-api**, **keyvaldb** bases now include full `envFrom` / `env` secret wiring (replacing metaboost.cc `deployment-secret-env.yaml` patches); **`enableServiceLinks: false`** on app Deployments (and keyvaldb) to avoid service-link env pollution; numeric ports remain from generated ConfigMaps.
- **`infra/k8s/local/stack`** aggregates `../../base/{db,keyvaldb,api,management-api,web,management-web}` with PVC size patches, JSON6902 removal of `imagePullSecrets`, SMP pull policy, `images:` for local tags, LoadBalancer service patch; added **`namespace.yaml`** and **`postgres-pvc-standalone.yaml`** for `make local_k3d_postgres_reset`.
- Removed **`infra/k8s/base/stack/`**; fixed **`local_k3d_postgres_reset`** to target **`metaboost-db`** Deployment (was incorrect `postgres`).
- **metaboost.cc**: dropped secret patches; pinned **`0.1.11-staging.1`** on all remote bases + GHCR `newTag` (tag must exist on `podverse/metaboost` after release).

#### Files Created/Modified

**metaboost**

- `infra/k8s/base/api/deployment.yaml`
- `infra/k8s/base/management-api/deployment.yaml`
- `infra/k8s/base/keyvaldb/deployment-valkey.yaml`
- `infra/k8s/base/web/deployment-web.yaml`
- `infra/k8s/base/web/deployment-web-sidecar.yaml`
- `infra/k8s/base/management-web/deployment-management-web.yaml`
- `infra/k8s/base/management-web/deployment-management-web-sidecar.yaml`
- `infra/k8s/local/stack/kustomization.yaml`
- `infra/k8s/local/stack/namespace.yaml`
- `infra/k8s/local/stack/local-pvc-size-patch.yaml`
- `infra/k8s/local/stack/local-image-behavior-patch.yaml`
- `infra/k8s/local/stack/service-exposure-patch.yaml`
- `infra/k8s/local/postgres-pvc-standalone.yaml`
- `scripts/k8s/kustomize-build-metaboost-bases.sh`
- `makefiles/local/Makefile.local.k3d.mk`
- `infra/k8s/INFRA-K8S.md`
- `infra/k8s/INFRA-K8S-BASE.md`
- `infra/INFRA.md`
- `infra/k8s/local-application.yaml`
- `docs/development/k8s/REMOTE-K8S-POSTGRES-REINIT.md`
- `docs/development/repo-management/K8S-BASE-REFERENCE-ALIGNMENT-CHECKLIST-06A.md`
- `.cursor/skills/argocd-gitops-push/SKILL.md`

**Deleted:** `infra/k8s/base/stack/*` (entire directory contents).

**metaboost.cc**

- `apps/metaboost-alpha/api/kustomization.yaml`
- `apps/metaboost-alpha/management-api/kustomization.yaml`
- `apps/metaboost-alpha/keyvaldb/kustomization.yaml`
- `apps/metaboost-alpha/db/kustomization.yaml`
- `apps/metaboost-alpha/ops/kustomization.yaml`
- `apps/metaboost-alpha/web/kustomization.yaml`
- `apps/metaboost-alpha/management-web/kustomization.yaml`
- `docs/k8s/metaboost-alpha/README.md`
- `scripts/check_metaboost_alpha_version_contract.sh`

**Deleted:** `apps/metaboost-alpha/api/deployment-secret-env.yaml`, `management-api/deployment-secret-env.yaml`, `keyvaldb/deployment-secret-env.yaml`.
