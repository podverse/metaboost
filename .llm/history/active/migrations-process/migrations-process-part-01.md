# Feature: migrations-process (Part 1)

> **Note**: This LLM history file is optional. If you're not using LLM assistance for development, you can delete this file and the containing directory. The history tracking system helps document LLM-assisted decisions but is not required for contributing.
> 
> **10-Session Limit**: Each part file is limited to 10 sessions. When adding Session 11, create `migrations-process-part-02.md`.

## Metadata
- Started: 2026-04-24
- Completed: In Progress
- Author: Mitch Downey
- LLM(s): Cursor, Claude, etc.
- GitHub Issues: None
- Branch: chore/migrations-process
- Origin: git@github.com:podverse/metaboost.git
- Is Fork: no

## Context

[What problem does this solve? What's the goal?]

## Sessions

### Session 1 - 2026-04-24

#### Prompt (Developer)
[First prompt will go here]

#### Key Decisions
- [Decision and rationale]

#### Files Changed
- [List of files]

### Session 2 - 2026-04-25

#### Prompt (Developer)
instead of writing a helper script, just create a document i can follow in both podverse and metaboost that documents all the steps i need to take to ensure full teardown of infra (including persistent volumes, configs, anything within the namespace) and with safety/sanity checks to ensure you will be deleting them from the correct server, and recommend an order for the teardown

#### Key Decisions
- Add a standalone teardown runbook in Metaboost docs rather than relying on scripts.
- Keep the teardown process safety-first with explicit context/API-server gates before destructive commands.
- Include GitOps-first app removal, namespace deletion, retained PV cleanup, and final verification checklist.

#### Files Changed
- .llm/history/active/migrations-process/migrations-process-part-01.md
- docs/development/k8s/ALPHA-NAMESPACE-FULL-TEARDOWN.md

### Session 3 - 2026-04-25

#### Prompt (Developer)
check the docs/development/ directories in both podverse and metaboost. if docs in there are specific to a thing (ex. k8s) those should be in a subdirectory. only keep things at the top level of docs/development if you think they are essential while the more specific docs go within subdirectories

#### Key Decisions
- Move Kubernetes/GitOps-specific development docs into `docs/development/k8s/`.
- Move security-specific development docs into `docs/development/security/`.
- Keep broad developer references (env, migrations, lockfile, publish flow, terms lifecycle) at top-level `docs/development/`.
- Update references across docs, infra docs, skills, scripts, and AGENTS to point to new subdirectory locations.

#### Files Changed
- .llm/history/active/migrations-process/migrations-process-part-01.md
- docs/development/STAGING-MAIN-PROMOTION.md
- docs/development/ENV-REFERENCE.md
- docs/development/ENV-VARS-CATALOG.md
- docs/development/LOCAL-ENV-OVERRIDES.md
- docs/development/METABOOST-PUBLISH-GITOPS-BUMP-CHECKLIST.md
- docs/development/k8s/ALPHA-NAMESPACE-FULL-TEARDOWN.md
- docs/development/k8s/ARGOCD-GITOPS-METABOOST.md
- docs/development/k8s/GITOPS-CUTOVER-STAGING-CHECKLIST.md
- docs/development/k8s/GITOPS-FUTURE-ENVIRONMENTS.md
- docs/development/k8s/K3D-ARGOCD-LOCAL.md
- docs/development/k8s/K8S-ENV-RENDER.md
- docs/development/k8s/REMOTE-K8S-GITOPS.md
- docs/development/k8s/REMOTE-K8S-POSTGRES-REINIT.md
- docs/development/security/SECURITY-FINDINGS-CLOSURE-MATRIX.md
- docs/development/security/SECURITY-REVIEW-CHECKLIST.md
- AGENTS.md
- scripts/security/check-sql-dynamic-fragments.mjs

### Session 4 - 2026-04-25

#### Prompt (Developer)
Balanced Docs/Development Regroup

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions
- Complete the balanced broad-folder regroup by moving env/release/tooling docs under dedicated folders.
- Keep only essential development references at top-level and maintain `k8s`, `security`, and `llm` as topic directories.
- Add a compact `DEVELOPMENT.md` index to make the new documentation layout easy to scan.

#### Files Changed
- .llm/history/active/migrations-process/migrations-process-part-01.md
- docs/development/DEVELOPMENT.md
- docs/development/env/ENV-REFERENCE.md
- docs/development/env/ENV-VARS-CATALOG.md
- docs/development/env/LOCAL-ENV-OVERRIDES.md
- docs/development/release/METABOOST-PUBLISH-GITOPS-BUMP-CHECKLIST.md
- docs/development/release/STAGING-MAIN-PROMOTION.md
- docs/development/security/SECURITY-FINDINGS-CLOSURE-MATRIX.md
- docs/development/security/SECURITY-REVIEW-CHECKLIST.md
- docs/development/k8s/K8S-ENV-RENDER.md
- docs/development/k8s/REMOTE-K8S-GITOPS.md
- AGENTS.md
- infra/INFRA.md
- infra/k8s/INFRA-K8S.md
- makefiles/local/Makefile.local.mk
- scripts/security/check-sql-dynamic-fragments.mjs
- dev/env-overrides/local/.gitkeep

### Session 5 - 2026-04-28

#### Prompt (Developer)
create the plan files locally

#### Key Decisions
- Create a new active plan set under `.llm/plans/active/metaboost-podverse-alignment/` with explicit execution order and phase files.
- Encode the requested constraints directly in plan content: breaking cutover, no compatibility aliases, no legacy references, and greenfield migration contract.
- Add a `COPY-PASTA.md` execution helper to enforce ordered implementation.

#### Files Changed
- .llm/history/active/migrations-process/migrations-process-part-01.md
- .llm/plans/active/metaboost-podverse-alignment/00-EXECUTION-ORDER.md
- .llm/plans/active/metaboost-podverse-alignment/01-env-overhaul.md
- .llm/plans/active/metaboost-podverse-alignment/02-expiration-rename.md
- .llm/plans/active/metaboost-podverse-alignment/03-llm-exports-parity.md
- .llm/plans/active/metaboost-podverse-alignment/04-ci-parity.md
- .llm/plans/active/metaboost-podverse-alignment/05-linear-migrations.md
- .llm/plans/active/metaboost-podverse-alignment/06-k8s-base-alpha-appofapps.md
- .llm/plans/active/metaboost-podverse-alignment/07-docs-alignment.md
- .llm/plans/active/metaboost-podverse-alignment/COPY-PASTA.md

### Session 6 - 2026-04-28

#### Prompt (Developer)
i have committed the changes so it should no longer be dirty. also, add to your plans to look for opportunities to bring the cursor files in metaboost into alignment with podverse, if the files are related to scope of work of these plans

#### Key Decisions
- Add a cross-cutting requirement in the active alignment plan set to evaluate Cursor-file alignment opportunities with Podverse during each phase.
- Keep Cursor alignment strictly scoped: only update `.cursor/skills/**`, `.cursor/rules/**`, and `.cursorrules` when those files are directly related to the current phase domain.
- Avoid unrelated Cursor-only churn and keep phase diffs focused.

#### Files Changed
- .llm/history/active/migrations-process/migrations-process-part-01.md
- .llm/plans/active/metaboost-podverse-alignment/00-EXECUTION-ORDER.md
- .llm/plans/active/metaboost-podverse-alignment/01-env-overhaul.md
- .llm/plans/active/metaboost-podverse-alignment/02-expiration-rename.md
- .llm/plans/active/metaboost-podverse-alignment/03-llm-exports-parity.md
- .llm/plans/active/metaboost-podverse-alignment/04-ci-parity.md
- .llm/plans/active/metaboost-podverse-alignment/05-linear-migrations.md
- .llm/plans/active/metaboost-podverse-alignment/06-k8s-base-alpha-appofapps.md
- .llm/plans/active/metaboost-podverse-alignment/07-docs-alignment.md
- .llm/plans/active/metaboost-podverse-alignment/COPY-PASTA.md

### Session 7 - 2026-04-28

#### Prompt (Developer)
address gaps and split the files further

#### Key Decisions
- Address serious planning gaps by adding explicit acceptance criteria and required verification gates in active phase plans.
- Split large phases into smaller execution units: env (01a/01b/01c), migrations (05a/05b/05c), and k8s (06a/06b/06c).
- Resolve execution ambiguity by updating execution-order and COPY-PASTA flow, including explicit policy for when parallel work is allowed.
- Keep Cursor-file alignment scoped to each phase domain only, avoiding unrelated churn.

#### Files Changed
- .llm/history/active/migrations-process/migrations-process-part-01.md
- .llm/plans/active/metaboost-podverse-alignment/00-EXECUTION-ORDER.md
- .llm/plans/active/metaboost-podverse-alignment/01-env-overhaul.md
- .llm/plans/active/metaboost-podverse-alignment/01a-env-contract-source-of-truth.md
- .llm/plans/active/metaboost-podverse-alignment/01b-env-script-and-make-cutover.md
- .llm/plans/active/metaboost-podverse-alignment/01c-env-docs-and-verification.md
- .llm/plans/active/metaboost-podverse-alignment/02-expiration-rename.md
- .llm/plans/active/metaboost-podverse-alignment/03-llm-exports-parity.md
- .llm/plans/active/metaboost-podverse-alignment/04-ci-parity.md
- .llm/plans/active/metaboost-podverse-alignment/05-linear-migrations.md
- .llm/plans/active/metaboost-podverse-alignment/05a-linear-contract-and-baseline-artifacts.md
- .llm/plans/active/metaboost-podverse-alignment/05b-linear-runner-scripts-and-make-targets.md
- .llm/plans/active/metaboost-podverse-alignment/05c-linear-ci-validation-and-docs.md
- .llm/plans/active/metaboost-podverse-alignment/06-k8s-base-alpha-appofapps.md
- .llm/plans/active/metaboost-podverse-alignment/06a-k8s-base-structure-parity.md
- .llm/plans/active/metaboost-podverse-alignment/06b-k8s-alpha-app-of-apps-parity.md
- .llm/plans/active/metaboost-podverse-alignment/06c-k8s-ops-env-integration-verification.md
- .llm/plans/active/metaboost-podverse-alignment/07-docs-alignment.md
- .llm/plans/active/metaboost-podverse-alignment/COPY-PASTA.md

### Session 8 - 2026-04-28

#### Prompt (Developer)
review the plan files you created one more time. do you see any serious gaps, or are we ready to work on them? if you see gaps you should fill, fill them, if not, tell me if the plans are ready in your opinion

#### Key Decisions
- Treat missing `00-SUMMARY.md` as a serious structural gap versus plan convention and add it before execution starts.
- Keep existing phase decomposition and execution order unchanged otherwise; no additional split was required for readiness.

#### Files Changed
- .llm/history/active/migrations-process/migrations-process-part-01.md
- .llm/plans/active/metaboost-podverse-alignment/00-SUMMARY.md

### Session 9 - 2026-04-28

#### Prompt (Developer)
i don't see prompts i can run in the copy pasta. there should be

#### Key Decisions
- Add explicit copy-paste execution prompts directly to COPY-PASTA so each plan step is runnable without ambiguity.
- Keep prompts scoped to the split execution sequence and include optional parallel prompts only where execution-order policy allows.

#### Files Changed
- .llm/history/active/migrations-process/migrations-process-part-01.md
- .llm/plans/active/metaboost-podverse-alignment/COPY-PASTA.md

### Session 10 - 2026-04-28

#### Prompt (Developer)
Implement .llm/plans/active/metaboost-podverse-alignment/01a-env-contract-source-of-truth.md now.

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

#### Key Decisions
- Establish contributor-facing canonical env source-of-truth as checked-in app and infra `.env.example` templates, aligned to Podverse layout.
- Keep template contract files as merge/render generation inputs (implementation internals), not primary contributor-facing contract docs.
- Add an explicit Metaboost vs Podverse source-of-truth alignment matrix documenting match status and intentional divergences.
- Align env-related Cursor guidance and AGENTS wording to the new 01a contract.

#### Files Changed
- .llm/history/active/migrations-process/migrations-process-part-01.md
- .cursor/skills/template contract-env/SKILL.md
- AGENTS.md
- docs/development/env/ENV-REFERENCE.md
- docs/development/env/ENV-SOURCE-OF-TRUTH-PARITY.md
- apps/api/.env.example
- apps/management-api/.env.example
- apps/web/.env.example
- apps/web/sidecar/.env.example
- apps/management-web/.env.example
- apps/management-web/sidecar/.env.example
- infra/config/env-templates/api.env.example
- infra/config/env-templates/management-api.env.example
- infra/config/env-templates/web.env.example
- infra/config/env-templates/web-sidecar.env.example
- infra/config/env-templates/management-web.env.example
- infra/config/env-templates/management-web-sidecar.env.example
- infra/config/env-templates/db.env.example
- infra/config/env-templates/keyvaldb.env.example

### Session 11 - 2026-04-28

#### Prompt (Developer)
Implement .llm/plans/active/metaboost-podverse-alignment/02-expiration-rename.md now.

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

#### Key Decisions
- Perform a breaking env-name cutover from expiry/TTL terms to explicit expiration terms for API and management auth/session/invitation contracts.
- Apply rename consistently across runtime config readers, startup validation, env templates/examples, k8s env projections, template contract env anchors, tests, and env docs.
- Keep token/cache/app-assertion TTL naming unchanged where not in this plan's auth/invitation env scope.

#### Files Changed
- .llm/history/active/migrations-process/migrations-process-part-01.md
- apps/api/.env.example
- apps/api/src/config/index.ts
- apps/api/src/lib/startup/validation.ts
- apps/api/src/test/setup.ts
- apps/management-api/.env.example
- apps/management-api/src/config/index.ts
- apps/management-api/src/controllers/usersController.ts
- apps/management-api/src/lib/startup/validation.ts
- apps/management-api/src/test/management-api.test.ts
- apps/management-api/src/test/management-users-admin-only-email.test.ts
- apps/management-api/src/test/setup.ts
- apps/management-api/src/test/startup-validation-auth-mode.test.ts
- apps/management-web/playwright.config.ts
- apps/management-web/src/context/AuthContext.tsx
- apps/web/playwright.e2e-server-env.ts
- apps/web/src/context/AuthContext.tsx
- docs/development/env/ENV-REFERENCE.md
- docs/development/env/ENV-VARS-CATALOG.md
- infra/config/env-templates/api.env.example
- infra/config/env-templates/management-api.env.example
- infra/env/template contract/base.yaml
- infra/k8s/base/stack/workloads.yaml
- packages/helpers-requests/src/session-lifecycle.ts

### Session 12 - 2026-04-28

#### Prompt (Developer)
Implement .llm/plans/active/metaboost-podverse-alignment/03-llm-exports-parity.md now.

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

#### Key Decisions
- Align the Prompt 5 scoped LLM export scripts, workflows, docs, and Cursor rules directly to Podverse references with no local policy drift.
- Keep unchanged files unchanged where already aligned (`scripts/llm/allowed-targets.mjs`, `scripts/llm/guard-exports-prompt.sh`).
- Add a dedicated phase checklist document under `docs/development/llm/` to satisfy the required Podverse reference-alignment record.

#### Files Changed
- .llm/history/active/migrations-process/migrations-process-part-01.md
- .cursor/rules/llm-cursor-source.mdc
- .cursor/rules/llm-exports-ci.mdc
- .github/workflows/llm-exports-full-sync.yml
- .github/workflows/llm-exports-sync.yml
- .llm/exports/LLM-EXPORTS.md
- docs/development/llm/EXPORT-TARGETS.md
- docs/development/llm/PODVERSE-REFERENCE-ALIGNMENT-CHECKLIST.md
- docs/development/llm/DOCS-DEVELOPMENT-LLM.md
- scripts/llm/export-from-cursor.mjs

### Session 13 - 2026-04-28

#### Prompt (Developer)
Implement .llm/plans/active/metaboost-podverse-alignment/04-ci-parity.md now.

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

#### Key Decisions
- Remove template contract-tooling dependencies from CI-facing validation and publish-validate paths while preserving non-CI template contract tooling used by env/k8s workflows.
- Keep existing Metaboost-specific CI safeguards (i18n and type-check gates) for now, and record them as intentional divergence in a dedicated CI reference-alignment checklist.
- Move completed plan files for phases 02/03/04 into completed plans and update active plan tracking docs in the same change.

#### Files Changed
- .llm/history/active/migrations-process/migrations-process-part-01.md
- .llm/plans/active/metaboost-podverse-alignment/00-EXECUTION-ORDER.md
- .llm/plans/active/metaboost-podverse-alignment/00-SUMMARY.md
- .llm/plans/active/metaboost-podverse-alignment/COPY-PASTA.md
- .llm/plans/completed/metaboost-podverse-alignment/02-expiration-rename.md
- .llm/plans/completed/metaboost-podverse-alignment/03-llm-exports-parity.md
- .llm/plans/completed/metaboost-podverse-alignment/04-ci-parity.md
- .github/workflows/ci.yml
- .github/workflows/publish-staging.yml
- makefiles/local/Makefile.local.mk
- makefiles/local/Makefile.local.test.mk
- makefiles/local/Makefile.local.validate.mk
- docs/development/repo-management/PODVERSE-CI-REFERENCE-ALIGNMENT-CHECKLIST.md

### Session 14 - 2026-04-28

#### Prompt (Developer)
Implement .llm/plans/active/metaboost-podverse-alignment/05a-linear-contract-and-baseline-artifacts.md now.

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

#### Key Decisions
- Establish canonical linear migration source directories under `infra/k8s/base/ops/source/database/linear-migrations/{app,management}` while keeping current runner path cutover for the next phase.
- Add machine-generated baseline artifact tooling in `scripts/database/` and commit generated `0003` and `0004` bootstrap artifacts.
- Align migration Cursor guidance to the generated-baseline contract and record 05a reference-alignment status in a dedicated checklist file.

#### Files Changed
- .llm/history/active/migrations-process/migrations-process-part-01.md
- .cursor/skills/linear-db-migrations/SKILL.md
- infra/k8s/base/ops/source/database/linear-migrations/app/0001_app_schema.sql
- infra/k8s/base/ops/source/database/linear-migrations/management/0001_management_schema.sql
- scripts/database/db.generate-baseline.env
- scripts/database/generate-linear-baseline.sh
- scripts/database/generate-linear-migration-history-seed.sh
- scripts/database/verify-linear-baseline.sh
- infra/k8s/base/db/source/bootstrap/0003_linear_baseline.sql
- infra/k8s/base/db/source/bootstrap/0004_seed_linear_migration_history.sql
- docs/development/repo-management/LINEAR-MIGRATIONS-REFERENCE-ALIGNMENT-CHECKLIST-05A.md

### Session 15 - 2026-04-28

#### Prompt (Developer)
Implement .llm/plans/active/metaboost-podverse-alignment/05b-linear-runner-scripts-and-make-targets.md now.

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

#### Key Decisions
- Cut over linear runner and validator path contracts from legacy `infra/k8s/base/db/source/*` to canonical `infra/k8s/base/ops/source/database/linear-migrations/*` for app and management databases.
- Update ops migration ConfigMap inputs in `infra/k8s/base/ops/kustomization.yaml` to reference canonical in-tree ops source paths.
- Add explicit local make helper targets for linear migration run, dry-run, status, validate, and baseline regenerate/verify workflows.
- Keep scope focused to 05b runner/make/ops path cutover and avoid unrelated fixes, including pre-existing web type-check failures.

#### Files Changed
- .llm/history/active/migrations-process/migrations-process-part-01.md
- scripts/database/run-linear-migrations.sh
- scripts/database/print-linear-migrations-status-k8s.sh
- scripts/database/validate-linear-migrations.sh
- infra/k8s/base/ops/kustomization.yaml
- makefiles/local/Makefile.local.validate.mk
- makefiles/local/Makefile.local.mk

### Session 16 - 2026-04-28

#### Prompt (Developer)
Implement .llm/plans/active/metaboost-podverse-alignment/06a-k8s-base-structure-parity.md now.

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

#### Key Decisions
- Align per-component base kustomization structure by adding explicit ConfigMap stub resources for API, management-api, web, and management-web bases.
- Wire web and management-web app deployments to base ConfigMap names to align generated env/config patch integration points across base workloads.
- Add a dedicated 06a k8s base reference-alignment checklist documenting completed parity checks and explicit intentional divergences.
- Update k8s-related Cursor guidance to the canonical linear migration path under `infra/k8s/base/ops/source/database/linear-migrations/*`.

#### Files Changed
- .llm/history/active/migrations-process/migrations-process-part-01.md
- infra/k8s/base/api/kustomization.yaml
- infra/k8s/base/api/configmap.yaml
- infra/k8s/base/web/kustomization.yaml
- infra/k8s/base/web/configmap-web.yaml
- infra/k8s/base/web/configmap-web-sidecar.yaml
- infra/k8s/base/web/deployment-web.yaml
- infra/k8s/base/management-api/kustomization.yaml
- infra/k8s/base/management-api/configmap.yaml
- infra/k8s/base/management-web/kustomization.yaml
- infra/k8s/base/management-web/configmap-management-web.yaml
- infra/k8s/base/management-web/configmap-management-web-sidecar.yaml
- infra/k8s/base/management-web/deployment-management-web.yaml
- docs/development/repo-management/K8S-BASE-REFERENCE-ALIGNMENT-CHECKLIST-06A.md
- .cursor/skills/argocd-gitops-push/SKILL.md

### Session 17 - 2026-04-28

#### Prompt (Developer)
Implement .llm/plans/active/metaboost-podverse-alignment/06b-k8s-alpha-app-of-apps-parity.md now.

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

#### Key Decisions
- Promote in-repo alpha app-of-apps to first-class by adding `infra/k8s/alpha-application.yaml` plus a complete child application set under `infra/k8s/alpha/apps/`.
- Add in-repo alpha component overlays (`alpha/common`, `alpha/api`, `alpha/web`, `alpha/management-api`, `alpha/management-web`, `alpha/db`, `alpha/keyvaldb`) that compose from existing base components.
- Remove scaffold-only messaging in alpha and Argo docs while preserving external GitOps consumption guidance.
- Align k8s/Argo Cursor guidance to include the alpha app-of-apps sync path in scope.

#### Files Changed
- .llm/history/active/migrations-process/migrations-process-part-01.md
- infra/k8s/alpha-application.yaml
- infra/k8s/alpha/apps/INFRA-K8S-ALPHA-APPS.md
- infra/k8s/alpha/apps/api.yaml
- infra/k8s/alpha/apps/common.yaml
- infra/k8s/alpha/apps/db.yaml
- infra/k8s/alpha/apps/keyvaldb.yaml
- infra/k8s/alpha/apps/management-api.yaml
- infra/k8s/alpha/apps/management-web.yaml
- infra/k8s/alpha/apps/metaboost-alpha-ops.application.yaml
- infra/k8s/alpha/apps/web.yaml
- infra/k8s/alpha/api/kustomization.yaml
- infra/k8s/alpha/common/kustomization.yaml
- infra/k8s/alpha/common/namespace.yaml
- infra/k8s/alpha/db/kustomization.yaml
- infra/k8s/alpha/keyvaldb/kustomization.yaml
- infra/k8s/alpha/management-api/kustomization.yaml
- infra/k8s/alpha/management-web/kustomization.yaml
- infra/k8s/alpha/web/kustomization.yaml
- infra/k8s/alpha/INFRA-K8S-ALPHA.md
- infra/k8s/INFRA-K8S.md
- docs/development/k8s/ARGOCD-GITOPS-METABOOST.md
- docs/development/repo-management/K8S-ALPHA-APP-OF-APPS-REFERENCE-ALIGNMENT-CHECKLIST-06B.md
- .cursor/skills/argocd-gitops-push/SKILL.md

### Session 18 - 2026-04-28

#### Prompt (Developer)
Implement .llm/plans/active/metaboost-podverse-alignment/07-docs-alignment.md now.

Template contract-removal finalization for this prompt:
- Remove residual maintained-source/docs references and run zero-reference verification for active template contract-system paths.

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

#### Key Decisions
- Remove remaining maintained-source/docs references to active template contract-system paths from docs and process guidance while keeping legacy implementation directories untouched.
- Align in-scope Cursor guidance files (`.cursor/skills/**`, `.cursor/rules/**`) to template-driven env/k8s wording as required by phase 07 scope.
- Record phase-level docs reference-alignment completion in a dedicated 07 checklist under repo-management docs.
- Keep plan files unchanged and limit edits to documentation/process references plus required history/checklist artifacts.

#### Files Changed
- .llm/history/active/migrations-process/migrations-process-part-01.md
- AGENTS.md
- .cursor/skills/template contract-env/SKILL.md
- .cursor/skills/linear-db-migrations/SKILL.md
- .cursor/skills/local-docker-k3d-alignment/SKILL.md
- .cursor/rules/env-file-formatting.mdc
- docs/development/k8s/REMOTE-K8S-GITOPS.md
- docs/development/k8s/REMOTE-K8S-POSTGRES-REINIT.md
- docs/development/env/ENV-REFERENCE.md
- docs/development/env/ENV-VARS-CATALOG.md
- docs/development/env/ENV-SOURCE-OF-TRUTH-PARITY.md
- docs/development/release/METABOOST-PUBLISH-GITOPS-BUMP-CHECKLIST.md
- docs/development/repo-management/PODVERSE-CI-REFERENCE-ALIGNMENT-CHECKLIST.md
- docs/development/repo-management/DOCS-REFERENCE-ALIGNMENT-CHECKLIST-07.md
- docs/testing/E2E-PAGE-TESTING.md
- infra/env/overrides/remote-k8s.yaml
- scripts/local-env/link-local-env-overrides.sh

---

## Related Resources

- [Link to PR]
- [Link to related issues]
