## Plan 03: Archive and Checklist Hygiene

## Objective
Prevent completed checklists from carrying stale operational instructions that conflict with the current process model.

## Steps
1. Review completed checklist/runbook files under `docs/development/repo-management/` for references to removed scripts/flows.
2. For completed historical artifacts:
   - either convert stale operational commands to neutral historical notes, or
   - explicitly mark them as superseded by current docs.
3. Ensure maintained runbooks point to current active docs (`REMOTE-K8S-GITOPS.md`, `AGENTS.md`, env docs).

## Relevant Files
- `docs/development/repo-management/K8S-OPS-ENV-INTEGRATION-REFERENCE-ALIGNMENT-CHECKLIST-06C.md`
- `docs/development/repo-management/DOCS-REFERENCE-ALIGNMENT-CHECKLIST-07.md`
- `docs/development/k8s/REMOTE-K8S-GITOPS.md`
- `docs/development/k8s/K8S-ENV-RENDER.md`

## Verification
1. `rg -n "scripts/k8s-env|alpha_env_render|validate-k8s-env-drift|remote-k8s.yaml" docs/development docs/development/repo-management AGENTS.md` returns no misleading active-process instructions.
2. Any remaining references are clearly marked as historical/superseded context.
