# 01 — Fix ESLint stale globs and commit rules

## Scope

Triage found:

- Stale block `files: ['scripts/llm/**/*.mjs', ...]` in `eslint.config.mjs` (scripts deleted in Plan 01)
- `require-relative-js-extension` wiring added — **KEEP** (matches Podverse tiered import rule)
- `eslint-rules/` untracked — commit per Plan 07

## Steps

1. Delete the `scripts/llm/**` override block from `eslint.config.mjs`.
2. Ensure tier A/B/C file globs match Podverse intent (already aligned in pending diff).
3. Commit `eslint-rules/require-relative-js-extension.mjs`.

## Do not change (pre-existing MB choices)

- `eslint-plugin-perfectionist` vs Podverse `eslint-plugin-simple-import-sort` — record PARITY-GAP
  for Plan 09; not in scope unless explicitly adopting simple-import-sort.

## Verification

```bash
./scripts/nix/with-env npm run lint
rg -n "scripts/llm" eslint.config.mjs || echo "stale glob removed"
```
