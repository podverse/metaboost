# Plan 03 — Rewrite Cursor guidance (Metaboost)

## Objective

Remove export-specific rules/skills; simplify to Cursor-only policy.

## Scope

Metaboost `.cursor/`, `AGENTS.md`, `.llm/LLM.md`, `docs/QUICK-START.md`.

## Steps

### 1. Delete export-only artifacts

- `.cursor/skills/llm-exports-scripts/` — delete
- `.cursor/rules/llm-exports-ci.mdc` — delete

### 2. Rewrite `llm-cursor-source` rule and skill

Same Cursor-only content as Podverse plan 03:

- Source of truth: `.cursor/skills/`, `.cursor/rules/`, `.cursorrules`, `.cursorignore`
- No `.llm/exports/`, no CI branches, no `LLM_EXPORT_ALLOW_LOCAL`, no non-Cursor editors

Files:

- `.cursor/rules/llm-cursor-source.mdc`
- `.cursor/skills/llm-cursor-source/SKILL.md`

### 3. Update `.cursor/skills/INDEX.md`

Remove `llm-exports-scripts` from the skills index table/list.

### 4. Update `AGENTS.md`

Remove export/Actions/alignment-prompt paragraphs from LLM section.

### 5. Update `.llm/LLM.md`

Remove "Machine-generated exports" section.

### 6. Update `docs/QUICK-START.md`

Remove references to export pipeline or `.llm/exports/` if present.

### 7. Stale reference sweep

```bash
rg -l 'llm-exports|export-from-cursor|LLM_EXPORT|LLM-EDITOR-ALIGNMENT|llm:exports|llm-exports-scripts' \
  --glob '!**/.llm/plans/completed/**' --glob '!**/node_modules/**'
```

Fix hits outside completed archives.

## Verification

```bash
./scripts/nix/with-env npm run lint
```

## Acceptance checklist

- [ ] Export skill/rule deleted
- [ ] `INDEX.md` updated
- [ ] `llm-cursor-source` is Cursor-only
- [ ] `AGENTS.md`, `.llm/LLM.md`, `QUICK-START.md` updated
