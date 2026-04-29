## Plan Set Summary: Metaboost Podverse Alignment

## Scope
This plan set aligns Metaboost with Podverse conventions in six major areas:
1. Env source-of-truth and local env workflow.
2. Expiration variable naming contract.
3. LLM exports policy and automation behavior.
4. CI workflow parity and reporting behavior.
5. Linear migration source, baseline, and verification process.
6. K8s base plus alpha app-of-apps structure and docs.
7. Full removal of template contract-based env tooling and references.

The plan is intentionally breaking-first:
- No compatibility aliases.
- No legacy/transitional wording in final state.
- Greenfield contract updates for canonical schema artifacts.

## Active Plan Files
1. [00-EXECUTION-ORDER.md](00-EXECUTION-ORDER.md)
2. [COPY-PASTA.md](COPY-PASTA.md)

There are no remaining active implementation plan files for this plan set.

## Completed Plan Files
1. [01a-env-contract-source-of-truth.md](../../completed/metaboost-podverse-alignment/01a-env-contract-source-of-truth.md)
2. [01b-env-script-and-make-cutover.md](../../completed/metaboost-podverse-alignment/01b-env-script-and-make-cutover.md)
3. [01c-env-docs-and-verification.md](../../completed/metaboost-podverse-alignment/01c-env-docs-and-verification.md)
4. [02-expiration-rename.md](../../completed/metaboost-podverse-alignment/02-expiration-rename.md)
5. [03-llm-exports-parity.md](../../completed/metaboost-podverse-alignment/03-llm-exports-parity.md)
6. [04-ci-parity.md](../../completed/metaboost-podverse-alignment/04-ci-parity.md)
7. [01-env-overhaul.md](../../completed/metaboost-podverse-alignment/01-env-overhaul.md)
8. [05a-linear-contract-and-baseline-artifacts.md](../../completed/metaboost-podverse-alignment/05a-linear-contract-and-baseline-artifacts.md)
9. [05b-linear-runner-scripts-and-make-targets.md](../../completed/metaboost-podverse-alignment/05b-linear-runner-scripts-and-make-targets.md)
10. [06a-k8s-base-structure-parity.md](../../completed/metaboost-podverse-alignment/06a-k8s-base-structure-parity.md)
11. [06b-k8s-alpha-app-of-apps-parity.md](../../completed/metaboost-podverse-alignment/06b-k8s-alpha-app-of-apps-parity.md)
12. [07-docs-alignment.md](../../completed/metaboost-podverse-alignment/07-docs-alignment.md)
13. [05-linear-migrations.md](../../completed/metaboost-podverse-alignment/05-linear-migrations.md)
14. [05c-linear-ci-validation-and-docs.md](../../completed/metaboost-podverse-alignment/05c-linear-ci-validation-and-docs.md)
15. [06-k8s-base-alpha-appofapps.md](../../completed/metaboost-podverse-alignment/06-k8s-base-alpha-appofapps.md)
16. [06c-k8s-ops-env-integration-verification.md](../../completed/metaboost-podverse-alignment/06c-k8s-ops-env-integration-verification.md)

## Dependency Map
1. Foundation contracts must be set before implementation phases.
2. Env overhaul is a hard blocker for expiration, CI, migration, and k8s alignment.
3. Expiration rename must complete before final migration and k8s phases.
4. LLM exports and CI parity can overlap only where 00-EXECUTION-ORDER explicitly allows.
5. CI and migration phases remove template contract checks and make/script dependencies before final k8s/env integration verification.
6. K8s/env integration phase removes remaining template contract and render dependencies.
7. Docs alignment is the final pass that removes residual references and validates zero maintained-source template contract dependencies.

## Parallelism Rules
1. Phases are sequential unless 00-EXECUTION-ORDER marks parallel work as safe.
2. Within a phase, sub-plans run in strict order unless explicitly marked parallel.
3. Do not start downstream phases until upstream verification gates pass.

## Completion Workflow
1. As soon as a plan file is completed, move it from `.llm/plans/active/metaboost-podverse-alignment/` to `.llm/plans/completed/metaboost-podverse-alignment/`.
2. In the same change, update `COPY-PASTA.md`, `00-SUMMARY.md`, and `00-EXECUTION-ORDER.md` references/status markers.
3. Keep only in-progress plan files under the active directory.

## Verification Baseline
1. Build/lint/type checks pass after each phase.
2. API/management-api changes require integration tests.
3. Web/management-web changes require targeted E2E tests.
4. Migration/k8s phases require parity checklists and successful render/verify commands.

## Cursor Alignment Requirement
1. During each phase, evaluate alignment opportunities for `.cursor/skills/**`, `.cursor/rules/**`, and `.cursorrules` only when directly related to current scope.
2. Do not include unrelated Cursor-only churn.

## Completion Definition
1. Phase steps are complete.
2. Verification gates pass.
3. Podverse reference-alignment checklist is recorded, including any intentional divergence with rationale.
4. No stale references to removed contracts remain.
