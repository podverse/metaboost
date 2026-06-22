# 01 — Align LLM root and dev docs

## Scope

Port Podverse wording into MetaBoost planning/contributor LLM docs while **keeping** MetaBoost-specific
policy (exports prohibition, `plan-files-convention` + `plan-execution-completion-tracking`).

## Files

### `.llm/LLM.md`

- **Keep** the `.llm/exports/` prohibition row (Podverse removed this row; MetaBoost correctly documents the ban).
- **Add** Podverse “Completing features (GitHub Actions)” section for `complete-feature.yml`, with a
  note if the workflow is not yet adopted (see plan 04).
- **Plans section:** cross-reference both `plan-files-convention` and Podverse `plan-completion` skill
  (adopt skill in abcmemory-align or link as optional).

### `docs/development/llm/DOCS-DEVELOPMENT-LLM.md`

- **Keep** “What we removed” exports prohibition block.
- Align plan/history sections with Podverse structure; reference MB plan completion rule/skill.
- Add complete-feature workflow paragraph when plan 04 adopts the workflow.

### `docs/development/llm/LLM-HISTORY-WORKFLOW-ARCHIVE.md`

- Port substantive updates from Podverse archive doc (retired workflow description for humans only).
- Ensure `.cursorignore` still lists this path.

## Verification

```bash
rg -n "complete-feature|plan-completion|llm/exports" .llm/LLM.md docs/development/llm/
```
