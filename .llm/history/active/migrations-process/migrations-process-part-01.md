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

---

## Related Resources

- [Link to PR]
- [Link to related issues]
