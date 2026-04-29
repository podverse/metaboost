## Plan: Metaboost Podverse Alignment Execution Order

Greenfield breaking alignment from Metaboost to Podverse conventions across env handling, expiration naming, .llm exports, CI, linear migrations, and k8s base plus alpha app-of-apps. This plan set also requires full removal of the template contract system from runtime tooling, CI/Make flows, and docs by the final phase. The implementation sequence below is optimized to avoid rework and to keep each stage independently verifiable.

## Steps
1. Phase A foundations and contracts.
2. Finalize target contracts for env templates, expiration variable names, migration directory contract, CI parity surface, and k8s app-of-apps structure.
3. Freeze naming and migration rules: no compatibility aliases, no legacy references, no transitional comments, breaking cutover only.
4. Phase B env system replacement (blocks most later work).
5. Phase B is complete: [01-env-overhaul.md](../../completed/metaboost-podverse-alignment/01-env-overhaul.md) and completed sub-plans [01a-env-contract-source-of-truth.md](../../completed/metaboost-podverse-alignment/01a-env-contract-source-of-truth.md), [01b-env-script-and-make-cutover.md](../../completed/metaboost-podverse-alignment/01b-env-script-and-make-cutover.md), and [01c-env-docs-and-verification.md](../../completed/metaboost-podverse-alignment/01c-env-docs-and-verification.md).
6. Phase C expiration contract cutover (depends on Phase B).
7. Phase C is complete: [02-expiration-rename.md](../../completed/metaboost-podverse-alignment/02-expiration-rename.md).
8. Phase D .llm exports parity (may run in parallel with late Phase C only after 02 reaches file-rename completion).
9. Phase D is complete: [03-llm-exports-parity.md](../../completed/metaboost-podverse-alignment/03-llm-exports-parity.md).
10. Phase E CI parity (may run in parallel with Phase D after env and expiration names are stable).
11. Phase E is complete: [04-ci-parity.md](../../completed/metaboost-podverse-alignment/04-ci-parity.md).
12. Phase F linear migrations parity (depends on Phases B and C).
13. Phase F is complete: [05-linear-migrations.md](../../completed/metaboost-podverse-alignment/05-linear-migrations.md), [05a-linear-contract-and-baseline-artifacts.md](../../completed/metaboost-podverse-alignment/05a-linear-contract-and-baseline-artifacts.md), [05b-linear-runner-scripts-and-make-targets.md](../../completed/metaboost-podverse-alignment/05b-linear-runner-scripts-and-make-targets.md), and [05c-linear-ci-validation-and-docs.md](../../completed/metaboost-podverse-alignment/05c-linear-ci-validation-and-docs.md).
14. Phase G k8s base and alpha app-of-apps alignment (depends on Phases B, C, and F).
15. Phase G is complete: [06-k8s-base-alpha-appofapps.md](../../completed/metaboost-podverse-alignment/06-k8s-base-alpha-appofapps.md), [06a-k8s-base-structure-parity.md](../../completed/metaboost-podverse-alignment/06a-k8s-base-structure-parity.md), [06b-k8s-alpha-app-of-apps-parity.md](../../completed/metaboost-podverse-alignment/06b-k8s-alpha-app-of-apps-parity.md), and [06c-k8s-ops-env-integration-verification.md](../../completed/metaboost-podverse-alignment/06c-k8s-ops-env-integration-verification.md).
16. Phase H documentation alignment and cleanup (after all implementation phases).
17. Phase H is complete: [07-docs-alignment.md](../../completed/metaboost-podverse-alignment/07-docs-alignment.md).
18. Run full verification matrix, including repository-wide zero-template contract-reference checks in maintained source/docs paths, and produce implementation report.

## Verification
1. Build, lint, and type-check pass after each phase.
2. Local env bootstrap from clean checkout succeeds without template contract tooling.
3. CI workflow run reflects updated parity behavior.
4. Linear migration regen and verify workflow succeeds.
5. Kustomize builds succeed for base and alpha app-of-apps structure.
6. For any phase touching api or management-api behavior, run integration tests: `./scripts/nix/with-env npm run test:e2e:api`.
7. For any phase touching web or management-web behavior, run targeted E2E make targets for changed surfaces.
8. Template contract system removal verification passes in final phases: no runtime/CI/docs dependency on `infra/env/template contract/**` or `scripts/env-template contract/**` remains in maintained Metaboost sources.

## Completion criteria
1. Each phase includes an explicit Podverse reference-alignment check and a pass or fail note.
2. Any allowed intentional divergence from Podverse is recorded with rationale in the phase file.
3. No phase is marked complete without running its listed verification gates.

## Cross-cutting requirement
1. During each phase, look for opportunities to align Metaboost Cursor files with Podverse when they are directly related to that phase scope.
2. Scope for this requirement includes `.cursor/skills/**`, `.cursor/rules/**`, and `.cursorrules` only when those files document or enforce behavior being changed in the current phase.
3. Do not do unrelated Cursor-only churn; keep alignment scoped to touched domains.

## Decisions
- Breaking changes are intentional and immediate.
- No compatibility aliases.
- No legacy or out-of-date references in code comments or docs.
- Greenfield migration style: update CREATE TABLE based canonical schema artifacts directly where needed; do not design around ALTER-first transitional paths.
