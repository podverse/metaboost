# Plan 04 — Revise LLM docs (Metaboost)

## Objective

Remove export docs; replace main LLM policy with Cursor-only guide.

## Scope

`docs/development/llm/` and inbound links.

## Steps

### 1. Delete export-specific docs

- `docs/development/llm/EXPORT-TARGETS.md`
- `docs/development/llm/GH-EXPORTS-SETUP.md`
- `docs/development/llm/LLM-EDITOR-ALIGNMENT-PROMPT.md`
- `docs/development/llm/CURSOR-COPILOT-SYNC.md`

### 2. Rewrite `DOCS-DEVELOPMENT-LLM.md`

Same structure as Podverse plan 04: Cursor-only source of truth, commit policy, plans/history, no export pipeline.

### 3. Fix inbound links

Grep `docs/`, `.cursor/`, `AGENTS.md` for links to deleted files; update or remove.

### 4. Keep `LLM-HISTORY-WORKFLOW-ARCHIVE.md`

Retain if useful; strip export references if any.

## Verification

```bash
rg 'EXPORT-TARGETS|GH-EXPORTS-SETUP|LLM-EDITOR-ALIGNMENT|github-copilot' docs .cursor AGENTS.md \
  --glob '!**/.llm/plans/completed/**'
```

## Acceptance checklist

- [ ] Four export docs deleted
- [ ] `DOCS-DEVELOPMENT-LLM.md` rewritten
- [ ] No broken inbound links
