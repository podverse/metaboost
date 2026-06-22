# MetaBoost ↔ Podverse Alignment Triage — Summary

## Purpose

This is a **stage-1 triage plan set**. Its job is to comb through MetaBoost's accumulated pending
changes (staged + unstaged + untracked), decide which are still valid, align them to Podverse
conventions, and **spawn stage-2 work plan sets** only where real work remains.

This pass (authoring these plan files) and the triage execution pass both produce **markdown plan
files only**. No product code, config, infra, or non-plan files are edited by the triage plans. Git
actions (unstage/revert/commit) are only ever **recommended to the operator**, never run by an agent.

## Source of truth

The **Podverse monorepo** (`/Users/mitcheldowney/repos/pv/podverse`) is the source of truth for
process, ops flow, and LLM standards. MetaBoost (`/Users/mitcheldowney/repos/pv/metaboost`) should
emulate it. When a MetaBoost change moves it toward Podverse conventions, that is good; when it
diverges, that is a finding.

## Scope

In scope: **process / ops-flow / LLM-standards / infra / CI** themes.

Out of scope: product-feature code (web push notifications, error boundaries, the helpers-requests
web auth/buckets refactor, ORM entity/service code). That work was already triaged by the completed
set `.llm/plans/completed/metaboost-staged-changes-cleanup/`. If a triage plan notices feature code
that contradicts a process/ops finding, it records a pointer but does not re-triage the feature code.

## Decision framework

Every pending change examined by a triage plan is classified as exactly one of:

| Decision     | Meaning                                                          | Action                                       |
| ------------ | --------------------------------------------------------------- | -------------------------------------------- |
| KEEP         | Already matches Podverse; valid as-is                           | Recommend operator commit it                 |
| ALIGN        | Right direction, but needs edits to match Podverse              | Spawn a stage-2 work plan set                |
| DISCARD      | Divergent, stale, or abandoned                                  | Recommend operator revert/unstage            |
| PARITY-GAP   | Podverse has something MetaBoost lacks (or vice versa)          | Spawn a stage-2 work plan set                |

Each triage plan ends by writing a **Decisions** section (a table mapping changed paths to one of the
above) and, when any ALIGN or PARITY-GAP rows exist, creating a focused stage-2 plan set under
`.llm/plans/active/`.

## Theme inventory (mapped to changed paths)

| Plan | Theme                          | Representative changed paths                                                                 |
| ---- | ------------------------------ | ------------------------------------------------------------------------------------------- |
| 01   | Multi-LLM exports removal      | `.llm/exports/**`, `scripts/llm/**`, `.github/workflows/llm-exports-*.yml`, export docs      |
| 02   | Changelog system removal       | `docs/development/CHANGELOGS/**`, `docs/operations/CHANGELOG-*`, `release-changelog` skill   |
| 03   | Cursor abcmemory additions     | `.cursor/hooks/`, `.cursor/prompts/`, new `.cursor/rules/*`, new `.cursor/skills/*`          |
| 04   | LLM workspace + docs restructure | `.llm/LLM.md`, `.llm/context/`, `.llm/history/`, `.llm/templates/`, `docs/development/llm/**` |
| 05   | CI / GitHub workflows + repo mgmt | `.github/workflows/**`, `.github/dependabot.yml`, `scripts/github/**`, `docs/repo-management/**` |
| 06   | K8s alpha + infra + env        | `infra/k8s/alpha/**`, `infra/k8s/base/**` env, `infra/config/env-templates/**`, infra docs   |
| 07   | Git hooks + dev scripts        | `scripts/git-hooks/**`, `scripts/start-feature.sh`, `scripts/local-env/setup.sh`, `eslint-rules/` |
| 08   | Build / package / lint config  | `package.json`, `eslint.config.mjs`, `packages/*/package.json`, `*/vitest.config.ts`         |
| 09   | Podverse parity inventory      | Full bidirectional `.cursor` rules/skills, workflows, Makefiles, scripts, docs, infra        |

## Confirmed parity facts (already verified during planning)

These are high-confidence facts gathered while creating this set. Triage plans should re-confirm but
can treat them as strong priors:

- Podverse has **no** `.llm/exports/`, **no** `scripts/llm/`, **no** `llm-exports-*` workflows.
  MetaBoost's removal of all of these **aligns** → expected KEEP (Plan 01).
- Podverse has **no** `docs/development/CHANGELOGS/` and **no** `release-changelog` skill. MetaBoost's
  removal **aligns** → expected KEEP (Plan 02).
- Podverse **has** web push (`apps/web/src/lib/notifications/webpush/`), `apps/web/src/app/error.tsx`,
  and `apps/web/src/app/global-error.tsx`. MetaBoost adding equivalents **aligns** (feature code is
  out of scope here, but this confirms direction).
- Podverse **has** `.cursor/hooks/` and `.cursor/prompts/`. MetaBoost adding them **aligns** (Plan 03).
- Podverse has **74** skills vs MetaBoost **69**; Podverse has several process/ops rules MetaBoost
  lacks (see Plan 09). MetaBoost has a few rules Podverse lacks (evaluate for adoption).

## Stage-1 → stage-2 contract

```
Stage 1 (this set):  triage plans analyze + record decisions + (if work) author stage-2 plan sets
Stage 2 (spawned):   focused work plan sets that actually edit code/config (executed later)
```

A triage plan that finds nothing to do simply records KEEP rows and marks its theme resolved. A
triage plan that finds ALIGN/PARITY-GAP rows creates a new directory under `.llm/plans/active/`
(e.g. `metaboost-podverse-parity-gaps/`) following the plan-files-convention, then references it from
its Decisions section. Stage-2 sets are not executed during triage.

## Conventions

- Follows [plan-files-convention](/.cursor/skills/plan-files-convention/SKILL.md) and
  [parallel-plan-execution](/.cursor/skills/parallel-plan-execution/SKILL.md).
- Markdown follows the markdown-formatting rule (100-char lines, aligned tables, blank lines).
- Each plan file stays under ~300 lines; split into `NN-part-N-*.md` if a theme grows.
- Existing active sets (`custom-css-remote-file-operator-themes`, `doc-link-path-missed-followup`)
  are left untouched.
