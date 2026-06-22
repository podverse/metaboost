# MetaBoost build config align — Summary

## Purpose

Align MetaBoost build/lint/test toolchain with Podverse after triage Plan 08: fix incomplete vitest
wiring, remove stale ESLint globs, and optional lint-staged cleanup.

## Plans

| File | Focus |
| --- | --- |
| 01-fix-eslint-stale-globs-and-commit-rules.md | Remove `scripts/llm/**` block; commit `eslint-rules/` |
| 02-complete-vitest-package-wiring.md | `packages/ui` test script + vitest deps |
| 03-remove-lint-staged-from-package-json.md | Coordinate with dev-scripts-align (pre-commit dropped) |

## Verification

```bash
./scripts/nix/with-env npm run lint
./scripts/nix/with-env npm run test:unit
./scripts/nix/with-env npm run build:packages
```
