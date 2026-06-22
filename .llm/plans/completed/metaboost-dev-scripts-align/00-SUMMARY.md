# MetaBoost dev scripts align — Summary

## Purpose

Align MetaBoost git hooks and dev scripts with Podverse after triage Plan 07. Primary drift:
MetaBoost still installs a **pre-commit** lint-staged hook; Podverse removed pre-commit and only
installs **pre-push** (branch naming).

## Plans

| File | Focus |
| --- | --- |
| 01-align-git-hooks-with-podverse.md | `install-hooks.sh`, drop pre-commit install |
| 02-sync-parity-dev-tooling-files.md | Commit/sync `normalize-markdown-links.mjs`, `eslint-rules/` |
| 03-review-bump-version-audit-gate.md | Audit allowlist parity vs Podverse |

Coordinate lint-staged removal from `package.json` with Plan 08 if dropping pre-commit fully.

## Verification

```bash
bash scripts/git-hooks/install-hooks.sh
test ! -f .git/hooks/pre-commit && echo "pre-commit absent OK"
rg -n "CHANGELOG|llm-exports|guard-exports" scripts || echo "scripts clean"
```
