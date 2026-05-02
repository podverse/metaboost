# metaboost-kustomize-merge-parity (Metaboost monorepo)

**Started:** 2026-04-30  
**Author:** LLM session  
**Context:** Align Metaboost K8s bases with Podverse generator + GitOps `behavior: merge` convention.

### Session 1 - 2026-04-30

#### Prompt (Agent)

Metaboost.cc `behavior: merge` vs Podverse conventions — Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Replaced static empty ConfigMap YAMLs under `infra/k8s/base/{api,management-api,web,management-web}` with **`configMapGenerator`** + **`source/*.env`** defaults (in-cluster hostnames; secrets omitted).
- Documented **unquoted** env-file lines for kustomize generators so `ConfigMap.data` does not retain stray `"` characters (Podverse `infra/k8s/base` style).
- Added [`scripts/k8s/kustomize-build-metaboost-bases.sh`](../../../scripts/k8s/kustomize-build-metaboost-bases.sh) and refreshed [`infra/k8s/INFRA-K8S-BASE.md`](../../../infra/k8s/INFRA-K8S-BASE.md); updated checklist **K8S-BASE-REFERENCE-ALIGNMENT-CHECKLIST-06A.md**.

#### Files Created/Modified

- `infra/k8s/base/api/kustomization.yaml`
- `infra/k8s/base/api/source/api.env`
- `infra/k8s/base/management-api/kustomization.yaml`
- `infra/k8s/base/management-api/source/management-api.env`
- `infra/k8s/base/web/kustomization.yaml`
- `infra/k8s/base/web/source/web.env`
- `infra/k8s/base/web/source/web-sidecar.env`
- `infra/k8s/base/management-web/kustomization.yaml`
- `infra/k8s/base/management-web/source/management-web.env`
- `infra/k8s/base/management-web/source/management-web-sidecar.env`
- `infra/k8s/INFRA-K8S-BASE.md`
- `scripts/k8s/kustomize-build-metaboost-bases.sh`
- `docs/development/repo-management/K8S-BASE-REFERENCE-ALIGNMENT-CHECKLIST-06A.md`
- Removed: `infra/k8s/base/api/configmap.yaml`, `management-api/configmap.yaml`, `web/configmap-web*.yaml`, `management-web/configmap-management-web*.yaml`
