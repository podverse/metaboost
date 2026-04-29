## Plan: 06c K8s Ops and Env Integration Verification

Finalize ops wiring and verify env/config integration behavior for base and alpha.

## Steps
1. Align ops resources and migration/maintenance job integration points.
2. Replace remaining template contract-backed render inputs with template/override-driven env generation for k8s ops/env flows.
3. Remove `scripts/env-template contract/*` and `infra/env/template contract/*` dependencies from k8s render/validation paths still used by Metaboost.
4. Verify generated env and secret artifacts integrate with base and alpha overlays after template contract removal.
5. Validate external GitOps-consumer compatibility assumptions remain true.
6. Align related Cursor guidance files with Podverse where they define k8s ops/env process rules.

## Relevant files
- infra/k8s/base/ops
- infra/k8s/alpha/ops
- scripts/k8s-env
- scripts/env-template contract
- docs/development/k8s/REMOTE-K8S-GITOPS.md
- docs/development/k8s/K8S-ENV-RENDER.md

## Verification
1. `kubectl kustomize` succeeds for alpha overlays and ops resources.
2. Env/secret integration behavior is validated end-to-end.
3. K8s ops/env render and validation paths no longer depend on template contract inputs/scripts.
4. Podverse reference-alignment checklist for ops/env behavior is complete.
