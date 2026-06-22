# Plan 02 — Remove exports tree and git config (Metaboost)

## Objective

Remove `.llm/exports/` and git/cursor configuration for multi-editor mirrors.

## Scope

Metaboost repo root.

## Steps

### 1. Delete `.llm/exports/` directory

Remove entire tree: `LLM-EXPORTS.md`, `.state/`, `github-copilot/`, `opencode/`.

### 2. Untrack cached paths

```bash
git rm -r --cached .llm/exports 2>/dev/null || true
```

### 3. Clean `.gitignore`

Remove export-related blocks (`/.llm/local/vendors.json`, per-target generated paths, export policy comments).

### 4. Clean `.cursorignore`

Remove `.llm/exports/` hide entry.

## Verification

```bash
test ! -d .llm/exports
git ls-files .llm/exports
# Expect empty
```

## Acceptance checklist

- [ ] `.llm/exports/` deleted
- [ ] No tracked export files
- [ ] `.gitignore` and `.cursorignore` cleaned
