# MetaBoost ↔ Podverse Alignment Triage — Execution Order

## How to read this file

- **Phases run sequentially.** Finish a phase before starting the next.
- **Within a phase, agents marked "parallel" run simultaneously.** Wait for all of them before
  moving on.
- Every triage plan is **read-only analysis**: it inspects MetaBoost's pending changes, compares to
  Podverse, writes a Decisions section into its own plan file, and (only if work remains) authors a
  stage-2 plan set. No code/config edits occur in any phase here.

## Phase 1 — Theme triage (parallel, read-only)

Plans 01–08 inspect independent areas of the diff and do not conflict. Run them in parallel
(up to 8 agents) using the COPY-PASTA prompts. Each plan writes its own Decisions section and may
author a stage-2 plan set.

- 01 — `01-llm-exports-removal-triage.md`
- 02 — `02-changelog-removal-triage.md`
- 03 — `03-cursor-abcmemory-triage.md`
- 04 — `04-llm-workspace-docs-triage.md`
- 05 — `05-ci-github-workflows-triage.md`
- 06 — `06-k8s-alpha-infra-env-triage.md`
- 07 — `07-git-hooks-dev-scripts-triage.md`
- 08 — `08-build-package-config-triage.md`

**Wait for all of Phase 1 to complete before Phase 2.**

## Phase 2 — Podverse parity inventory (single agent)

- 09 — `09-podverse-parity-inventory.md`

Runs after Phase 1 so it can incorporate any PARITY-GAP rows the theme plans surfaced. Produces the
consolidated `metaboost-podverse-parity-gaps` stage-2 plan set (if gaps are accepted).

**Wait for Phase 2 to complete before Phase 3.**

## Phase 3 — Consolidation (single agent)

- Collect every stage-2 plan set spawned in Phases 1–2 into a single index appended to this file
  (a `Spawned stage-2 plan sets` section), so the operator has one place to drive follow-up work.
- Recommend (do not run) the git actions implied by all DISCARD decisions, grouped by plan, in one
  fenced `bash` block for the operator.
- When the whole triage set is finished and all spawned stage-2 sets are either executed or queued,
  move this set to `.llm/plans/completed/metaboost-podverse-alignment-triage/`.

## Parallelization summary

```
Phase 1: 8 agents in parallel (plans 01-08)  -> WAIT
Phase 2: 1 agent (plan 09)                    -> WAIT
Phase 3: 1 agent (consolidation)              -> done
```

## Spawned stage-2 plan sets

**Phase 3 consolidated:** 2026-06-21. Run each set's `COPY-PASTA.md` to implement alignment (not
during triage). Suggested order: exports cleanup → abcmemory → build/dev scripts → CI → infra →
llm workspace → parity gaps (skills/tooling last; defers to abcmemory + ci-ops for rules/workflows).

| Source plan | Stage-2 set path | Plans | Status |
| --- | --- | --- | --- |
| 01 | `.llm/plans/active/metaboost-llm-exports-reference-cleanup/` | 1 | **Queued** — stale ESLint `scripts/llm` glob |
| 02 | _(none)_ | — | **Resolved** — KEEP only (changelog removal) |
| 03 | `.llm/plans/active/metaboost-abcmemory-align/` | 4 | **Queued** — adopt rules, port drifted abcmemory |
| 04 | `.llm/plans/active/metaboost-llm-workspace-align/` | 4 | **Queued** — `.llm/` + LLM docs |
| 05 | `.llm/plans/active/metaboost-ci-ops-align/` | 4 | **Queued** — workflows, ci.yml, dependabot |
| 06 | `.llm/plans/active/metaboost-infra-env-align/` | 3 | **Queued** — k8s env, linear baseline gz |
| 07 | `.llm/plans/active/metaboost-dev-scripts-align/` | 3 | **Queued** — git hooks, dev scripts |
| 08 | `.llm/plans/active/metaboost-build-config-align/` | 3 | **Queued** — ESLint, vitest, lint-staged |
| 09 | `.llm/plans/active/metaboost-podverse-parity-gaps/` | 5 + notes | **Queued** — ADOPT skills, run-workspaces |

**Total:** 8 stage-2 sets, 27 numbered implementation plans (+ `PROMOTE-TO-PODVERSE-NOTES.md`).

## DISCARD decisions — operator git actions

Only one DISCARD row across all triage plans. Run from MetaBoost repo root:

```bash
# Plan 04 — DISCARD empty .llm/local/ (not in Podverse; unused)
rmdir .llm/local 2>/dev/null || rm -rf .llm/local
```

All other themes: **KEEP** deletions/commits proceed via stage-2 alignment PRs; no revert needed.

## Triage completion

All 10 COPY-PASTA prompts complete. This set moved to
`.llm/plans/completed/metaboost-podverse-alignment-triage/`.
