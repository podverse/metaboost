### Session 1 — 2026-05-02

#### Prompt (Developer)

K8s alignment across Podverse, Metaboost, k.podcastdj.com, metaboost.cc

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- **DB:** Replaced Deployment + standalone PVC with **StatefulSet** + **`volumeClaimTemplates`** (`db-data`, 20Gi); filenames **`service.yaml`** + **`statefulset.yaml`**; **Argo CD** child app **`ignoreDifferences`** on volumeClaimTemplates (Podverse parity).
- **Keyvaldb:** Renamed manifests to **`deployment.yaml`**, **`service.yaml`**, **`pvc.yaml`** (PVC retained — unlike Podverse emptyDir).
- **Alpha/db:** Added **labels**, **`images`** postgres tag, commented **patches** stub (Podverse-shaped `kustomization.yaml`).
- **Web / management-web:** **Merged** sidecar into single **Deployment** per product; **`RUNTIME_CONFIG_URL`** → **`http://127.0.0.1:<port>`**; **Kustomize `replacements`** for Service/Deployment port coupling; removed separate sidecar Deployments/Services and initContainers.
- **Docs:** **`REMOTE-K8S-POSTGRES-REINIT`** (StatefulSet/PVC names, port-forward svc), **`REMOTE-K8S-GITOPS`** (GitOps directory symmetry), **`INFRA-K8S-BASE`**, **`ENV-VARS-REFERENCE`** for runtime-config URL wiring.

#### Files Created/Modified

- `infra/k8s/base/db/statefulset.yaml` (new)
- `infra/k8s/base/db/service.yaml` (new)
- `infra/k8s/base/db/kustomization.yaml`
- Removed: `infra/k8s/base/db/deployment-postgres.yaml`, `pvc-postgres.yaml`, `service-postgres.yaml`
- `infra/k8s/alpha/apps/db.yaml`
- `infra/k8s/alpha/db/kustomization.yaml`
- `infra/k8s/base/keyvaldb/deployment.yaml` (new), `service.yaml` (new), `pvc.yaml` (new), `kustomization.yaml`
- Removed: `infra/k8s/base/keyvaldb/deployment-valkey.yaml`, `service-valkey.yaml`, `pvc-valkey.yaml`
- `infra/k8s/base/web/deployment.yaml` (new), `service.yaml` (new), `kustomization.yaml`
- `infra/k8s/base/web/source/web.env`
- Removed: `infra/k8s/base/web/deployment-web.yaml`, `deployment-web-sidecar.yaml`, `service-web.yaml`, `service-web-sidecar.yaml`
- `infra/k8s/base/management-web/deployment.yaml` (new), `service.yaml` (new), `kustomization.yaml`
- `infra/k8s/base/management-web/source/management-web.env`
- Removed: `infra/k8s/base/management-web/deployment-management-web.yaml`, `deployment-management-web-sidecar.yaml`, `service-management-web.yaml`, `service-management-web-sidecar.yaml`
- `docs/development/k8s/REMOTE-K8S-POSTGRES-REINIT.md`
- `docs/development/k8s/REMOTE-K8S-GITOPS.md`
- `infra/k8s/INFRA-K8S-BASE.md`
- `docs/development/env/ENV-VARS-REFERENCE.md`
- `infra/docker/local/docker-compose.yml` (comment only)

### Session 2 — 2026-05-02

#### Prompt (Developer)

align it with podverse

#### Key Decisions

- Added **`infra/k8s/alpha/db/tailscale-patch.yaml`** mirroring Podverse’s Tailscale Operator Service patch, targeting **`metaboost-db`** and **`metaboost-alpha-db-k`** hostname; **`kustomization.yaml`** patch comments matched Podverse (still commented off).

#### Files Created/Modified

- `infra/k8s/alpha/db/tailscale-patch.yaml` (new)
- `infra/k8s/alpha/db/kustomization.yaml`

### Session 3 — 2026-05-02

#### Prompt (Developer)

do it

#### Key Decisions

- Removed **`ServerSideApply=true`** from **`infra/k8s/alpha/apps/db.yaml`** (gzipped baselines keep bootstrap ConfigMaps small).

#### Files Created/Modified

- `infra/k8s/alpha/apps/db.yaml`
