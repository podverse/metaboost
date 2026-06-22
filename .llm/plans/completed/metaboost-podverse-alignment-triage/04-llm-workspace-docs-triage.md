# 04 — LLM Workspace + Docs Restructure Triage

## Scope

The `.llm/` tree is a **planning workspace** (plans, history, context, templates) — not abcmemory.
This theme triages MetaBoost's restructure of `.llm/` and its LLM-process documentation under
`docs/development/llm/`, aligning the workspace shape and the contributor-facing LLM docs to
Podverse.

This is distinct from Plan 03 (committed `.cursor/` agent memory) and Plan 01 (the removed exports
pipeline). Where a file is ambiguous between themes (e.g. `llm-history` skill), Plan 01 owns the
exports/history-tracking removal and this plan owns the workspace structure + docs.

## Changed paths

- `.llm/LLM.md` (modified — large rewrite per diff stat)
- `.llm/context/` (new), `.llm/history/active/`, `.llm/history/completed/` (new index files),
  `.llm/templates/LLM-TEMPLATES.md` (new), `.llm/plans/active/LLM-PLANS-ACTIVE.md`,
  `.llm/plans/completed/LLM-PLANS-COMPLETED.md` (new index files)
- `docs/development/llm/DOCS-DEVELOPMENT-LLM.md` (modified)
- `docs/development/llm/LLM-HISTORY-WORKFLOW-ARCHIVE.md` (new)
- Note: deleted LLM docs (`EXPORT-TARGETS.md`, `GH-EXPORTS-SETUP.md`, `CURSOR-COPILOT-SYNC.md`,
  `LLM-EDITOR-ALIGNMENT-PROMPT.md`) are triaged in Plan 01.

## Triage method

1. Compare MetaBoost `.llm/` structure to Podverse `.llm/` (directories: `plans/active`,
   `plans/completed`, `history/active`, `history/completed`, `context`, `templates`). Confirm
   MetaBoost's new index files (`LLM-*.md`) match Podverse's naming and purpose.
2. Diff `docs/development/llm/DOCS-DEVELOPMENT-LLM.md` against Podverse's contributor LLM policy doc.
   Classify drift as KEEP/ALIGN.
3. Confirm `.llm/LLM.md` rewrite reflects the post-exports world (no references to the removed export
   pipeline) and matches Podverse's `.llm/LLM.md` intent where applicable.
4. Check `.llm/context/` content for accuracy (e.g. architecture tier table referenced by
   `architecture-tier-dependencies` rule) against Podverse's `.llm/context/architecture.md`.
5. Confirm the new active history/plan folders that are untracked are intended to be committed vs.
   left local (compare to Podverse's `.gitignore`/policy for `.llm/`).

## Expected decisions

| File group                              | Decision | Notes                                              |
| --------------------------------------- | -------- | -------------------------------------------------- |
| `.llm/` directory structure + indexes   | TBD      | KEEP if parity; ALIGN if shape differs from Podverse|
| `.llm/LLM.md` rewrite                    | TBD      | KEEP if consistent + export-free                    |
| `DOCS-DEVELOPMENT-LLM.md`               | TBD      | ALIGN if drifted from Podverse policy               |
| `LLM-HISTORY-WORKFLOW-ARCHIVE.md`       | TBD      | KEEP if matches Podverse history workflow           |
| `.llm/context/` content                 | TBD      | ALIGN if architecture context is stale/incorrect    |

## Decisions

**Executed:** 2026-06-21  
**Podverse check:** Same top-level `.llm/` layout (`context/`, `history/`, `plans/`, `templates/`);
same `docs/development/llm/` files (2 docs each). MetaBoost has extra `.llm/local/` (empty).

| Path / group | Decision | Notes |
| --- | --- | --- |
| `.llm/` directory structure | **KEEP** | Matches Podverse except `.llm/local/` (empty legacy dir) |
| `.llm/plans/active/LLM-PLANS-ACTIVE.md` + completed index | **ALIGN** | Minor wording: MB cites `plan-files-convention`; PV cites `plan-completion` |
| `.llm/history/active/LLM-HISTORY-ACTIVE.md` | **KEEP** | Same pattern as Podverse |
| `.llm/templates/LLM-TEMPLATES.md` | **KEEP** | Present in both; no blocking drift checked |
| `.llm/LLM.md` rewrite | **ALIGN** | MB adds exports-prohibition row (KEEP that); missing Podverse **complete-feature.yml** history automation section |
| `docs/development/llm/DOCS-DEVELOPMENT-LLM.md` | **ALIGN** | Drift: plan-completion vs plan-files-convention refs; MB has extra “What we removed” exports policy (**KEEP**); missing complete-feature workflow paragraph |
| `docs/development/llm/LLM-HISTORY-WORKFLOW-ARCHIVE.md` | **ALIGN** | Large drift (~195 diff lines) vs Podverse archive doc |
| `.llm/context/architecture.md` | **KEEP** | **MetaBoost-specific** tier table (correct for MB packages); do not replace with Podverse architecture |
| `.llm/context/conventions.md` | **ALIGN** | Drift vs Podverse; port generic sections, keep MB package/app names |
| `.llm/context/LLM-CONTEXT.md` | **ALIGN** | Differs from Podverse; align structure |
| `.llm/local/` | **DISCARD** | Empty dir not in Podverse; remove or gitignore (operator) |
| Export pipeline refs in LLM docs | **KEEP** | Prohibition text in `LLM.md` + `DOCS-DEVELOPMENT-LLM.md` is correct post-removal policy |
| `.github/workflows/complete-feature.yml` | **PARITY-GAP** | Podverse has it; MetaBoost does not — cross-ref Plan 05 CI or stage-2 plan 04 |

**Stage-2 spawned:** `.llm/plans/active/metaboost-llm-workspace-align/`

## Stage-2 spawn rule

If the workspace structure or LLM docs drift from Podverse, create
`.llm/plans/active/metaboost-llm-workspace-align/` listing each file and the structure/wording to
port. Otherwise record "no stage-2 needed".

## Verification (for the operator, later)

```bash
diff <(cd /Users/mitcheldowney/repos/pv/metaboost && find .llm -maxdepth 2 -type d | sort) <(cd /Users/mitcheldowney/repos/pv/podverse && find .llm -maxdepth 2 -type d | sort)
```
