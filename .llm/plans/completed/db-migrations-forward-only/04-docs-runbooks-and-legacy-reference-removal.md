# Phase 4 - Metaboost docs, runbooks, and legacy reference removal

## Scope

Finalize the migration process transition in docs and developer workflows, and remove old-process references.

## Key files

- `docs/development/DB-MIGRATIONS.md` (new)
- `docs/development/INFRA-K8S.md` (or `infra/k8s/INFRA-K8S.md`)
- `docs/development/k8s/K3D-ARGOCD-LOCAL.md` (if migration workflow is referenced there)
- `docs/development/k8s/REMOTE-K8S-GITOPS.md` (only monorepo guidance updates; no external repo edits)
- `makefiles/local/Makefile.local.test.mk`
- `makefiles/local/Makefile.local.k3d.mk`
- `makefiles/local/Makefile.local.mk` (if surfacing new migration targets)

## Steps

1. **Write forward-only migration runbook**
   - Define:
     - creating new linear migration files;
     - running local/app/management migrations;
     - baseline onboarding for existing DBs;
     - running `metaboost-ops` one-off K8s migration jobs.

2. **Align infra docs**
   - Update K8s docs to describe migration job workflow and stale-cache prevention expectations.
   - Keep language explicit that this plan set does not perform external GitOps repo changes.

3. **Remove outdated references**
   - Remove active mentions of previous migration process names from docs/make/help outputs.
   - Keep docs focused on forward-only linear workflows.

4. **Final consistency pass**
   - Ensure script names, Makefile targets, and docs all use the same forward-only terminology.

## Verification

- `rg` search results for migration workflows align with forward-only terminology.
- New migration runbook includes first boot + existing DB upgrade + ops one-off job usage.
- Local make/help text points contributors to forward-only commands.
