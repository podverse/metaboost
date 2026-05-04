# argocd-setup-portability

## Started

2026-05-03

## Context

Portable Argo CD setup model for Metaboost monorepo and external GitOps repos.

### Session 1 - 2026-05-03

#### Prompt (Developer)

Argo CD Setup Portability Plan

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

you stalled. continue

#### Key Decisions

- Kept ownership boundary explicit: live Argo `Application` manifests remain in GitOps repositories; monorepo now provides templates/contracts/check scripts.
- Added Metaboost reusable Argo examples under `infra/k8s/argocd/examples/metaboost-alpha` with canonical sync-wave annotations.
- Added Metaboost sync-wave contract documentation and reusable Argo app contract checker script.
- Added references to wave contract in Metaboost remote GitOps runbook.

#### Files Modified

- `docs/development/k8s/REMOTE-K8S-GITOPS.md`
- `docs/development/k8s/ARGOCD-SYNC-WAVE-CONTRACT.md`
- `infra/k8s/argocd/examples/INFRA-K8S-ARGOCD-EXAMPLES.md`
- `infra/k8s/argocd/examples/metaboost-alpha/common.yaml`
- `infra/k8s/argocd/examples/metaboost-alpha/db.yaml`
- `infra/k8s/argocd/examples/metaboost-alpha/keyvaldb.yaml`
- `infra/k8s/argocd/examples/metaboost-alpha/ops.yaml`
- `infra/k8s/argocd/examples/metaboost-alpha/api.yaml`
- `infra/k8s/argocd/examples/metaboost-alpha/management-api.yaml`
- `infra/k8s/argocd/examples/metaboost-alpha/web.yaml`
- `infra/k8s/argocd/examples/metaboost-alpha/management-web.yaml`
- `infra/k8s/scripts/check_argocd_app_contract.sh`
- `infra/k8s/alpha/apps/common.yaml`
- `infra/k8s/alpha/apps/db.yaml`
- `infra/k8s/alpha/apps/keyvaldb.yaml`
- `infra/k8s/alpha/apps/ops.yaml`
- `infra/k8s/alpha/apps/api.yaml`
- `infra/k8s/alpha/apps/management-api.yaml`
- `infra/k8s/alpha/apps/web.yaml`
- `infra/k8s/alpha/apps/management-web.yaml`
