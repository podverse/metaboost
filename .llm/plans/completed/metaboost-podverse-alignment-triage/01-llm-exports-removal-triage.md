# 01 — Multi-LLM Exports Removal Triage

## Scope

MetaBoost previously generated per-vendor LLM guidance (GitHub Copilot, OpenCode) from the Cursor
source via a `scripts/llm/` export pipeline, committed the generated output under `.llm/exports/`,
and ran sync workflows. This theme triages the **removal** of that entire system.

Podverse (source of truth) has **no** export pipeline: no `.llm/exports/`, no `scripts/llm/`, no
`llm-exports-*` workflows. So the expected outcome is that MetaBoost's removal is correct and should
be kept; the work is to confirm the removal is complete and no dangling references remain.

## Changed paths (deletions unless noted)

- `.llm/exports/**` (entire tree: `github-copilot/`, `opencode/`, `.state/`, `LLM-EXPORTS.md`)
- `scripts/llm/allowed-targets.mjs`, `scripts/llm/export-from-cursor.mjs`,
  `scripts/llm/guard-exports-prompt.sh`, `scripts/llm/vendor-config.mjs`,
  `scripts/llm/vendor-selector.mjs`, `scripts/llm/lib/*-adapter.mjs`
- `.github/workflows/llm-exports-full-sync.yml`, `.github/workflows/llm-exports-sync.yml`,
  `.github/workflows/llm-exports-optional-cloud-llm.yml`
- `.cursor/skills/llm-exports-scripts/SKILL.md`, `.cursor/skills/llm-history/SKILL.md` (verify
  whether `llm-history` belongs to this theme or Plan 04)
- `.cursor/rules/llm-exports-ci.mdc`, `.cursor/rules/llm-history-tracking.mdc`
- `docs/development/llm/EXPORT-TARGETS.md`, `docs/development/llm/GH-EXPORTS-SETUP.md`,
  `docs/development/llm/CURSOR-COPILOT-SYNC.md`, `docs/development/llm/LLM-EDITOR-ALIGNMENT-PROMPT.md`
- `.gitignore`, `.cursorignore` (entries that referenced exports/state)

## Triage method

1. Confirm Podverse has none of these constructs (already verified: true).
2. Search MetaBoost's **remaining** tree for dangling references to the removed system:
   - `rg -n "llm/exports|export-from-cursor|vendor-selector|EXPORT-TARGETS|GH-EXPORTS|copilot-instructions|opencode-instructions|llm-exports" --glob '!.llm/plans/**'`
   - Check `.cursorrules`, `AGENTS.md`, `docs/development/llm/DOCS-DEVELOPMENT-LLM.md`,
     `package.json` scripts, Makefiles, and any workflow for references to export targets/scripts.
3. Confirm `.gitignore` / `.cursorignore` no longer reference now-deleted export/state paths in a way
   that is misleading.
4. Cross-check the completed set `.llm/plans/completed/remove-multi-llm-exports/` to avoid
   re-deciding what was already settled; this triage only verifies completeness.

## Expected decisions

Most rows should be **KEEP** (removal aligns to Podverse). Create ALIGN rows only for dangling
references that still need cleanup.

| Path / group                     | Decision | Notes                                             |
| -------------------------------- | -------- | ------------------------------------------------- |
| `.llm/exports/**`                | KEEP     | Podverse has no exports tree                       |
| `scripts/llm/**`                 | KEEP     | Podverse has no export scripts                     |
| `.github/workflows/llm-exports-*`| KEEP     | Podverse has no export workflows                   |
| export docs (4 files)            | KEEP     | confirm no inbound links remain                    |
| `.cursorignore` / `.gitignore`   | TBD      | KEEP if clean; ALIGN if stale entries remain       |
| dangling references (if any)     | ALIGN    | spawn stage-2 cleanup if found                     |

(Fill the table with concrete results during execution.)

## Decisions

**Executed:** 2026-06-21  
**Podverse check:** No `.llm/exports/`, `scripts/llm/`, or `llm-exports-*` workflows (aligned).  
**Prior work:** `.llm/plans/completed/remove-multi-llm-exports/` — removal largely complete; this
triage verifies completeness only.

| Path / group | Decision | Notes |
| --- | --- | --- |
| `.llm/exports/**` | **KEEP** | Gone from working tree; Podverse has no exports tree |
| `scripts/llm/**` | **KEEP** | Gone; Podverse has no export scripts |
| `.github/workflows/llm-exports-*` (3 files) | **KEEP** | Gone; Podverse has no export workflows |
| `docs/development/llm/EXPORT-TARGETS.md` etc. (4 files) | **KEEP** | Gone; no inbound links to deleted paths |
| `.cursor/skills/llm-exports-scripts` | **KEEP** | Gone; INDEX.md has no export skill entry |
| `.cursor/skills/llm-history` | **KEEP** | Gone; tied to removed `llm-history-tracking` rule. Optional human archive in `LLM-HISTORY-WORKFLOW-ARCHIVE.md` (`.cursorignore`) — not agent guidance; Plan 04 owns workspace history policy |
| `.cursor/rules/llm-exports-ci.mdc` | **KEEP** | Gone |
| `.cursor/rules/llm-history-tracking.mdc` | **KEEP** | Gone |
| `.gitignore` | **KEEP** | No stale `.llm/exports` or export-state entries |
| `.cursorignore` | **KEEP** | Only lists archived history doc (intentional) |
| `docs/development/llm/DOCS-DEVELOPMENT-LLM.md` § "What we removed" | **KEEP** | Mentions `.llm/exports/` as **prohibited** policy — correct, not a dangling ref |
| `docs/development/llm/LLM-HISTORY-WORKFLOW-ARCHIVE.md` | **KEEP** | Historical archive of retired rule; cursorignored |
| `eslint.config.mjs` `scripts/llm/**` override block | **ALIGN** | Dead ESLint glob (lines 81–86); directory deleted |
| `package.json` / Makefiles / git hooks | **KEEP** | No export script refs; `llm/` branch prefix is unrelated (LLM-only PRs) |
| `AGENTS.md` / `.cursorrules` | **KEEP** | Cursor-only policy; no export pipeline refs |

**Stage-2 spawned:** `.llm/plans/active/metaboost-llm-exports-reference-cleanup/` (one stale ESLint block).

**Operator git (KEEP deletions):** Stage and commit the export-removal deletions when ready — no
DISCARD rows in this theme.

## Stage-2 spawn rule

If step 2 finds dangling references, create
`.llm/plans/active/metaboost-llm-exports-reference-cleanup/` with a focused plan listing each
reference and the exact edit, following the plan-files-convention. Otherwise record "no stage-2
needed".

## Verification (for the operator, later)

```bash
rg -n "llm/exports|export-from-cursor|vendor-selector|llm-exports" /Users/mitcheldowney/repos/pv/metaboost --glob '!.llm/plans/**' || echo "no dangling references"
```
