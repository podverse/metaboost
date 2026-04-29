# COPY-PASTA

Execute this plan set in strict order using the numbered files in this directory.

## Execution order
1. 00-EXECUTION-ORDER.md
2. ../../completed/metaboost-podverse-alignment/01-env-overhaul.md (COMPLETED)
3. ../../completed/metaboost-podverse-alignment/02-expiration-rename.md (COMPLETED)
4. ../../completed/metaboost-podverse-alignment/03-llm-exports-parity.md (COMPLETED)
5. ../../completed/metaboost-podverse-alignment/04-ci-parity.md (COMPLETED)
6. ../../completed/metaboost-podverse-alignment/05-linear-migrations.md (COMPLETED)
7. ../../completed/metaboost-podverse-alignment/05a-linear-contract-and-baseline-artifacts.md (COMPLETED)
8. ../../completed/metaboost-podverse-alignment/05b-linear-runner-scripts-and-make-targets.md (COMPLETED)
9. ../../completed/metaboost-podverse-alignment/05c-linear-ci-validation-and-docs.md (COMPLETED)
10. ../../completed/metaboost-podverse-alignment/06-k8s-base-alpha-appofapps.md (COMPLETED)
11. ../../completed/metaboost-podverse-alignment/06a-k8s-base-structure-parity.md (COMPLETED)
12. ../../completed/metaboost-podverse-alignment/06b-k8s-alpha-app-of-apps-parity.md (COMPLETED)
13. ../../completed/metaboost-podverse-alignment/06c-k8s-ops-env-integration-verification.md (COMPLETED)
14. ../../completed/metaboost-podverse-alignment/07-docs-alignment.md (COMPLETED)

## Execution policy
1. Make breaking changes directly; do not add compatibility aliases.
2. Do not add legacy or transitional references.
3. Use greenfield migration contract updates in canonical CREATE TABLE based artifacts where needed.
4. During each phase, look for opportunities to align Metaboost Cursor files with Podverse when those files are related to the current phase scope.
5. After each phase: run targeted verification, then commit phase-scoped changes.
6. When a plan file is completed, move it immediately from `.llm/plans/active/metaboost-podverse-alignment/` to `.llm/plans/completed/metaboost-podverse-alignment/` and update references in this file and summary/execution-order docs in the same change.
7. Keep diffs scoped to current phase unless a hard dependency requires cross-phase touchpoints.
8. Parallel work is allowed only where 00-EXECUTION-ORDER.md explicitly marks it as safe.

## Phase completion gate
A phase is complete when:
1. Its implementation steps are done.
2. Its verification section passes.
3. No residual references remain to removed contracts for that phase.
4. Template contract-removal milestones for that phase (if any) are completed.
5. Completed plan file has been moved to the completed directory and prompt/status references were updated.

## Copy-paste prompts

Use one prompt at a time in order. Do not skip ahead unless 00-EXECUTION-ORDER.md explicitly allows parallel execution.

### Prompt 1 (COMPLETED)
```text
Implement .llm/plans/completed/metaboost-podverse-alignment/01a-env-contract-source-of-truth.md now.

Status:
- COMPLETED
```

### Prompt 2 (COMPLETED)
```text
Implement .llm/plans/completed/metaboost-podverse-alignment/01b-env-script-and-make-cutover.md now.

Status:
- COMPLETED
```

### Prompt 3 (COMPLETED)
```text
Implement .llm/plans/completed/metaboost-podverse-alignment/01c-env-docs-and-verification.md now.

Status:
- COMPLETED
```

### Prompt 4 (COMPLETED)
```text
Implement .llm/plans/completed/metaboost-podverse-alignment/02-expiration-rename.md now.

Status:
- COMPLETED
```

### Prompt 5 (COMPLETED)
```text
Implement .llm/plans/completed/metaboost-podverse-alignment/03-llm-exports-parity.md now.

Status:
- COMPLETED
```

### Prompt 6 (COMPLETED)
```text
Implement .llm/plans/completed/metaboost-podverse-alignment/04-ci-parity.md now.

Status:
- COMPLETED
```

### Prompt 7 (COMPLETED)
```text
Implement .llm/plans/completed/metaboost-podverse-alignment/05a-linear-contract-and-baseline-artifacts.md now.

Status:
- COMPLETED
```

### Prompt 8 (COMPLETED)
```text
Implement .llm/plans/completed/metaboost-podverse-alignment/05b-linear-runner-scripts-and-make-targets.md now.

Status:
- COMPLETED
```

### Prompt 9 (COMPLETED)
```text
Implement .llm/plans/completed/metaboost-podverse-alignment/05c-linear-ci-validation-and-docs.md now.

Rules:
- Follow 00-EXECUTION-ORDER.md and 00-SUMMARY.md.
- Do not edit plan files.
- Make only scoped changes for this plan.
- Run the verification listed in the plan.
- Update .llm/history/active/migrations-process/migrations-process-part-01.md for this session.

When done, report:
1) files changed,
2) verification commands run and outcomes,
3) any intentional divergence from Podverse with rationale.
```

### Prompt 10 (COMPLETED)
```text
Implement .llm/plans/completed/metaboost-podverse-alignment/06a-k8s-base-structure-parity.md now.

Status:
- COMPLETED
```

### Prompt 11 (COMPLETED)
```text
Implement .llm/plans/completed/metaboost-podverse-alignment/06b-k8s-alpha-app-of-apps-parity.md now.

Status:
- COMPLETED
```

### Prompt 12 (COMPLETED)
```text
Implement .llm/plans/completed/metaboost-podverse-alignment/06c-k8s-ops-env-integration-verification.md now.

Template contract-removal milestone for this prompt:
- Complete removal of template contract-system runtime/render dependencies from k8s ops/env integration paths.

Rules:
- Follow 00-EXECUTION-ORDER.md and 00-SUMMARY.md.
- Do not edit plan files.
- Make only scoped changes for this plan.
- Run the verification listed in the plan.
- Update .llm/history/active/migrations-process/migrations-process-part-01.md for this session.

When done, report:
1) files changed,
2) verification commands run and outcomes,
3) any intentional divergence from Podverse with rationale.
```

### Prompt 13 (COMPLETED)
```text
Implement .llm/plans/completed/metaboost-podverse-alignment/07-docs-alignment.md now.

Status:
- COMPLETED
```

## Optional parallel prompts (only when 00-EXECUTION-ORDER.md says safe)

No active optional parallel prompts remain for completed phases.
