## Plan: 06a K8s Base Structure Parity

Align base k8s structure and component layout with Podverse conventions.

## Steps
1. Align base kustomization structure and component directory contracts with Podverse patterns.
2. Align workload grouping and generated env/secret patch integration points.
3. Align related Cursor guidance files with Podverse where they define k8s structure conventions.

## Relevant files
- infra/k8s/base
- infra/k8s/base/stack
- infra/k8s/base/db
- infra/k8s/INFRA-K8S.md

## Verification
1. `kubectl kustomize` succeeds for base stack builds.
2. Base structure reference-alignment checklist against Podverse is complete.
