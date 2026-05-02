# Metaboost-Podverse Alignment Plan Set

Objective: align metaboost database, migration, k8s, CI, testing, and env/user naming conventions with podverse as closely as possible across:
- metaboost repo
- separate Metaboost GitOps repository
- Podverse operator GitOps repository (historical location of metaboost overlays before dedicated Metaboost GitOps)

## Plan files
- 01-gap-matrix.md: explicit misalignment inventory and target state
- 02-phase-a-db-baseline-bootstrap.md: baseline and bootstrap convergence
- 03-phase-b-runner-k8s-ci-test.md: runner, k8s jobs, CI, and local test convergence
- 04-phase-c-gitops-secrets-env-docs.md: gitops secret/env naming and docs/rules convergence
- 05-unstaged-parity-audit-and-remediation.md: strict PASS/FAIL audit of current unstaged state plus required remediation tasks
- 06-podverse-last-24h-commit-ingest.md: prioritized ingestion of newest podverse process changes into metaboost alignment work
- 90-copy-pasta-prompts.md: COPY-PASTA prompts to execute each phase in bounded chunks

## Global success criteria
1. Fresh DB bootstrap in metaboost no longer depends on a standalone 0004 seed step for migration history.
2. Forward-only migration runner behavior and k8s path contract mirror podverse behavior, including `LINEAR_MIGRATIONS_BASE_DIR` / `LINEAR_MIGRATIONS_DIR` semantics and single-source runner scripts.
3. CI and local test DB initialization use the same migration runner model as production-style processes.
4. DB key naming contracts across metaboost and gitops repos enforce role-based keys and reject legacy admin-key patterns.
5. Docs and guardrails reflect the converged model and prevent drift.

## Guardrails
1. Prefer smallest safe diffs per PR.
2. Keep generated artifacts generated, not hand-edited.
3. Preserve existing app behavior while converging process contracts.
4. Run validation after each phase before starting next phase.
