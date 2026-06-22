# MetaBoost ↔ Podverse Alignment Triage — Copy-Pasta Prompts

## Execution rules

- **Phases are sequential.** Finish a phase before starting the next.
- **Within Phase 1, the 8 prompts are parallel-safe** (independent areas of the diff). Run up to 8
  agents at once, or run them one at a time — but wait for all of Phase 1 before Phase 2.
- Every triage prompt is a **triage pass** (not implementation):
  1. Inspect MetaBoost's pending changes and compare to Podverse.
  2. Write a `## Decisions` section into the referenced triage plan file.
  3. **If ALIGN or PARITY-GAP work remains**, create a full **stage-2 plan set** under
     `.llm/plans/active/<name>/` (`00-SUMMARY.md`, `00-EXECUTION-ORDER.md`, numbered plans,
     `COPY-PASTA.md`) — this is required output, not optional.
  4. **Do not** edit product code, `.cursor/` abcmemory, config, or infra during triage — that
     happens when the operator runs the spawned stage-2 COPY-PASTA prompts later.
- "Read-only" means **read-only toward the repo being aligned**, not read-only toward plan files.
- Recommend git actions (unstage/revert/commit) to the operator; never run them.

## When this set is complete (what you should have locally)

After all 10 prompts finish, you should have **new stage-2 plan sets** under
`.llm/plans/active/` — one per theme that still needs work (examples: `metaboost-abcmemory-align/`,
`metaboost-podverse-parity-gaps/`, `metaboost-ci-ops-align/`). Themes that are fully aligned
(KEEP only) spawn **nothing**.

Each spawned set is a **full plan package** ready for a **second COPY-PASTA run**:

```
.llm/plans/active/<spawned-name>/
├── 00-SUMMARY.md
├── 00-EXECUTION-ORDER.md
├── 01-….md … NN-….md    # implementation steps
└── COPY-PASTA.md          # paste these prompts next to do the real edits
```

**This triage set does not implement alignment.** It only decides what to keep and authors the
implementation plans. Run each spawned set's `COPY-PASTA.md` in a **separate session** (or parallel
where allowed) to port Podverse rules, fix CI, clean refs, etc.

Phase 3 (Agent 10) updates `00-EXECUTION-ORDER.md` with an index of every spawned set so you have one
checklist of what to run next.

## Status tracker

| Prompt | Plan                              | Done |
| ------ | --------------------------------- | ---- |
| 1      | 01-llm-exports-removal-triage     | [x]  |
| 2      | 02-changelog-removal-triage       | [x]  |
| 3      | 03-cursor-abcmemory-triage        | [x]  |
| 4      | 04-llm-workspace-docs-triage      | [x]  |
| 5      | 05-ci-github-workflows-triage     | [x]  |
| 6      | 06-k8s-alpha-infra-env-triage     | [x]  |
| 7      | 07-git-hooks-dev-scripts-triage   | [x]  |
| 8      | 08-build-package-config-triage    | [x]  |
| 9      | 09-podverse-parity-inventory      | [x]  |
| 10     | Phase 3 consolidation             | [x]  |

---

## PHASE 1 — Theme triage (8 agents, parallel-safe)

### Agent 1

```
Read and execute .llm/plans/active/metaboost-podverse-alignment-triage/01-llm-exports-removal-triage.md

Triage the multi-LLM exports removal vs Podverse (source of truth). Classify each change KEEP/ALIGN/
DISCARD, write a Decisions section into the plan file, and if dangling references remain create
metaboost-llm-exports-reference-cleanup under .llm/plans/active/ (full plan set). No product/config
edits during triage; recommend git actions, do not run them.
```

### Agent 2

```
Read and execute .llm/plans/active/metaboost-podverse-alignment-triage/02-changelog-removal-triage.md

Triage the changelog system removal vs Podverse. Classify KEEP/ALIGN/DISCARD, write a Decisions
section, and if changelog references remain create metaboost-changelog-reference-cleanup under
.llm/plans/active/ (full plan set). No product/config edits during triage.
```

### Agent 3

```
Read and execute .llm/plans/active/metaboost-podverse-alignment-triage/03-cursor-abcmemory-triage.md

Triage new/modified .cursor abcmemory files (hooks, prompts, rules, skills, indexes) vs Podverse
counterparts. Classify KEEP/ALIGN, write a Decisions section, and if files drift from Podverse create
metaboost-abcmemory-align under .llm/plans/active/ (full plan set). No .cursor/ edits during triage.
```

### Agent 4

```
Read and execute .llm/plans/active/metaboost-podverse-alignment-triage/04-llm-workspace-docs-triage.md

Triage the .llm/ workspace restructure and docs/development/llm changes vs Podverse. Classify
KEEP/ALIGN, write a Decisions section, and if drift exists create metaboost-llm-workspace-align
under .llm/plans/active/ (full plan set). No product/config edits during triage.
```

### Agent 5

```
Read and execute .llm/plans/active/metaboost-podverse-alignment-triage/05-ci-github-workflows-triage.md

Triage CI/GitHub workflows, dependabot, labels, and repo-management/release docs vs Podverse ops
flow. Classify KEEP/ALIGN, capture Podverse-only CI gates as PARITY-GAP for Plan 09, write a
Decisions section, and if drift exists create metaboost-ci-ops-align under .llm/plans/active/
(full plan set). No product/config edits during triage.
```

### Agent 6

```
Read and execute .llm/plans/active/metaboost-podverse-alignment-triage/06-k8s-alpha-infra-env-triage.md

Triage the k8s alpha overlay, base/template env files, infra docs, and linear-baseline ops flow vs
Podverse conventions (ops-flow only, not column-level SQL). Classify KEEP/ALIGN, write a Decisions
section, and if drift exists create metaboost-infra-env-align under .llm/plans/active/ (full plan
set). No infra/k8s edits during triage (Argo CD push applies to stage-2 execution).
```

### Agent 7

```
Read and execute .llm/plans/active/metaboost-podverse-alignment-triage/07-git-hooks-dev-scripts-triage.md

Triage git hooks and dev scripts (start-feature, local-env setup, bump-version non-changelog parts,
env-overrides, markdown link normalizer, eslint-rules) vs Podverse. Classify KEEP/ALIGN, note
MetaBoost-only tooling for Plan 09, write a Decisions section, and if drift exists create
metaboost-dev-scripts-align under .llm/plans/active/ (full plan set). No script edits during triage.
```

### Agent 8

```
Read and execute .llm/plans/active/metaboost-podverse-alignment-triage/08-build-package-config-triage.md

Triage build/package/lint config (package.json, eslint.config.mjs, eslint-rules wiring, vitest
configs, tsconfig, lockfile) vs Podverse conventions. Classify KEEP/ALIGN, write a Decisions section,
and if drift exists create metaboost-build-config-align under .llm/plans/active/ (full plan set).
No product/config edits during triage.
```

**WAIT for all 8 Phase 1 agents to complete before Phase 2.**

---

## PHASE 2 — Parity inventory (1 agent)

### Agent 9

```
Read and execute .llm/plans/active/metaboost-podverse-alignment-triage/09-podverse-parity-inventory.md

Recompute the bidirectional .cursor rules/skills deltas and incorporate PARITY-GAP rows from Plans
01-08. Classify each Podverse-only item ADOPT vs N/A and each MetaBoost-only item MB-SPECIFIC vs
PROMOTE. Write a Decisions section and create metaboost-podverse-parity-gaps under
.llm/plans/active/ (full plan set) for accepted ADOPT items plus PROMOTE-TO-PODVERSE-NOTES.md.
No edits to the Podverse repo; no MetaBoost product/config edits during triage.
```

**WAIT for Phase 2 to complete before Phase 3.**

---

## PHASE 3 — Consolidation (1 agent)

### Agent 10

```
Read .llm/plans/active/metaboost-podverse-alignment-triage/00-EXECUTION-ORDER.md and consolidate the
triage results: fill in the "Spawned stage-2 plan sets" index with every stage-2 set created in
Phases 1-2, and produce one fenced bash block of recommended git actions for all DISCARD decisions
(grouped by plan) for the operator to run manually. Then, if every theme is resolved and stage-2
sets are queued, move this set to
.llm/plans/completed/metaboost-podverse-alignment-triage/. Read-only except for the plan-file
updates and the move; do not edit product code.
```
