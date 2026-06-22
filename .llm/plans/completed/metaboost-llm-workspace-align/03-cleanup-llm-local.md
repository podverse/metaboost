# 03 — Cleanup `.llm/local/`

## Scope

MetaBoost has an empty `.llm/local/` directory not present in Podverse.

## Options (pick one)

1. **Remove** the empty directory (recommended if unused).
2. **Document** in `.llm/LLM.md` as operator-local-only (not committed content) and add to
   `.gitignore` if future local notes land there.

## Steps

1. Confirm directory is empty and unused in git history intent.
2. Apply chosen option.
3. Re-run directory structure diff vs Podverse.

## Operator git (if removing)

```bash
rmdir .llm/local
git add -A .llm/
```
