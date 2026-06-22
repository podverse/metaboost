# 01 — Remove stale ESLint `scripts/llm` glob

## Scope

The export pipeline under `scripts/llm/` was deleted. `eslint.config.mjs` still contains an override
block targeting that path.

## File

[`eslint.config.mjs`](/eslint.config.mjs) — remove the config object at lines 81–86:

```javascript
  {
    files: ['scripts/llm/**/*.mjs', 'scripts/llm/**/*.js', 'scripts/llm/**/*.cjs'],
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
```

The general `scripts/**` override (lines 75–80) already covers remaining scripts.

## Steps

1. Delete the block above (including trailing comma as needed for valid JS).
2. Confirm no other `scripts/llm` references remain.

## Verification

```bash
rg -n "scripts/llm" /Users/mitcheldowney/repos/pv/metaboost --glob '!.llm/plans/**' || echo "clean"
npm run lint
```
