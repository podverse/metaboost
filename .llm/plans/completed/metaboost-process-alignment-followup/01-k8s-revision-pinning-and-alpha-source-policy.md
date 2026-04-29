## Plan 01: K8s Revision Pinning and Alpha Source Policy

## Objective
Align in-repo alpha k8s manifests with Podverse-style stability guidance by replacing moving refs (`develop`) where policy expects immutable revision pins.

## Steps
1. Inventory all `targetRevision: develop` and `?ref=develop` usage in `infra/k8s/alpha*` and related k8s docs.
2. Decide one canonical policy for committed manifests:
   - Option A: immutable tags (preferred), or
   - Option B: explicit temporary moving ref policy with required follow-up pin workflow.
3. Apply the chosen policy consistently across root app, child apps, and alpha component kustomizations.
4. Update docs so examples and guidance match the chosen policy exactly.
5. Record any intentional divergence rationale in a checklist file.

## Relevant Files
- `infra/k8s/alpha-application.yaml`
- `infra/k8s/alpha/apps/*.yaml`
- `infra/k8s/alpha/*/kustomization.yaml`
- `infra/k8s/INFRA-K8S.md`
- `docs/development/k8s/GITOPS-CUTOVER-STAGING-CHECKLIST.md`

## Verification
1. `rg -n "targetRevision:\s*develop|\?ref=develop" infra/k8s docs/development/k8s` returns only intentional, documented exceptions.
2. `kubectl kustomize infra/k8s/alpha/api` succeeds.
3. `kubectl kustomize infra/k8s/alpha/ops` succeeds.
