## Plan: 06b K8s Alpha App-of-Apps Parity

Adopt in-repo alpha app-of-apps as first-class model and align to Podverse structure.

## Steps
1. Align alpha root application and child application manifest layout with Podverse pattern.
2. Align alpha app naming, source paths, and Argo wiring expectations.
3. Remove scaffold-only assumptions conflicting with first-class in-repo app-of-apps.
4. Align related Cursor guidance files with Podverse where they govern Argo/app-of-apps process rules.

## Relevant files
- infra/k8s/alpha-application.yaml
- infra/k8s/alpha/apps
- infra/k8s/alpha/common
- docs/development/k8s/ARGOCD-GITOPS-METABOOST.md

## Verification
1. Alpha app-of-apps manifests are coherent and render correctly.
2. Argo app path and source contracts are internally consistent.
3. Alpha reference-alignment checklist against Podverse is complete.
