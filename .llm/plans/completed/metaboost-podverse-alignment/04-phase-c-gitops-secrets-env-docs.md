# Phase C Plan: GitOps Secrets/Env Convergence and Docs Anti-Drift

Goal: complete full naming/process convergence across this monorepo, the Metaboost GitOps repository, and related operator GitOps repos with enforceable contracts.

## Scope
1. Inventory and align metaboost-related secret generators in gitops repos.
2. Enforce role-based DB key family contracts and forbid legacy admin keys.
3. Align metaboost overlay manifest consumption with converged key names.
4. Update docs and rule guidance to the converged process.

## Work items
1. Metaboost GitOps repo secret generator alignment
- Audit DB secret generator outputs.
- Ensure app/management secrets are split and include required role-based keys.
- Add/align contract checks for required keys and forbidden legacy keys.

2. Podverse operator GitOps repo metaboost overlay alignment (when overlays still live there)
- Audit metaboost-alpha manifests and secret refs.
- Ensure migration jobs and runtime workloads consume converged key names.
- Add/align secret contract validation scripts for metaboost DB secrets.

3. metaboost docs/rules convergence
- Rewrite DB migration docs to converged baseline contract.
- Remove transitional divergence references after implementation is complete.
- Add clear generated-artifact guardrails and verification command expectations.

## Acceptance criteria
1. GitOps DB secret generation/validation enforces role-based key names only.
2. metaboost overlays consume the same converged key names and contracts.
3. metaboost docs reflect final process with no obsolete transitional model language.
4. Cross-repo runbooks include post-merge sync reminders where remote refs are pinned.

## Suggested execution order
1. Implement and validate secret key contract checks.
2. Update overlay manifest key consumption.
3. Update docs/rules/checklists.
4. Run full verification checklist.
