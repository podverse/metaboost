## Plan: K8s Base Plus Alpha App-of-Apps Alignment

Adopt Podverse-like in-repo alpha app-of-apps structure while preserving thin-overlay compatibility for external GitOps consumers.

This phase is split into smaller executable plans to reduce risk and review size:

1. [06a-k8s-base-structure-parity.md](../../completed/metaboost-podverse-alignment/06a-k8s-base-structure-parity.md) (completed)
2. [06b-k8s-alpha-app-of-apps-parity.md](../../completed/metaboost-podverse-alignment/06b-k8s-alpha-app-of-apps-parity.md) (completed)
3. [06c-k8s-ops-env-integration-verification.md](06c-k8s-ops-env-integration-verification.md)

## Steps
1. Complete 06a, then 06b, then 06c in strict order.
2. Align related Cursor guidance files with Podverse when they define k8s/Argo/GitOps process expectations.
3. Remove scaffold-only messaging that conflicts with in-repo app-of-apps as standard.
4. Ensure external GitOps flow remains supported as a consumer model.

## Relevant files
- infra/k8s/alpha-application.yaml
- infra/k8s/alpha/apps
- infra/k8s/alpha/common
- infra/k8s/alpha/api
- infra/k8s/alpha/web
- infra/k8s/alpha/management-api
- infra/k8s/alpha/management-web
- infra/k8s/base
- infra/k8s/INFRA-K8S.md
- docs/development/k8s/REMOTE-K8S-GITOPS.md
- docs/development/k8s/ARGOCD-GITOPS-METABOOST.md

## Verification
1. All verification gates in 06a, 06b, and 06c pass.
2. K8s reference-alignment checklist against Podverse is complete.

## Decisions
- In-repo alpha app-of-apps is adopted as primary convention.
- External GitOps remains a supported downstream consumption path.
- Cursor alignment is in-scope only for k8s/GitOps-related `.cursor` files touched by this phase.
