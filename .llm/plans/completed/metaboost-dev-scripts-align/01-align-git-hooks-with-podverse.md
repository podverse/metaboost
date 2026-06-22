# 01 — Align git hooks with Podverse

## Scope

Podverse `scripts/git-hooks/install-hooks.sh`:

- Skips install when no git context (CI/Docker safe)
- Uses `git rev-parse --git-path hooks`
- **Removes** legacy `pre-commit` (`rm -f`)
- Installs **pre-push** only

MetaBoost still copies `pre-commit` (lint-staged) and uses a simpler `.git/hooks` path.

## Steps

1. Port Podverse `install-hooks.sh` behavior to MetaBoost (keep MetaBoost paths/comments).
2. Stop installing `pre-commit`; optionally delete `scripts/git-hooks/pre-commit` or leave
   documented as unused legacy (Podverse deleted the file entirely).
3. Confirm `pre-push` matches Podverse after pending diff (already includes `llm/` branch).
4. Coordinate with Plan 08: remove `lint-staged` from root `package.json` if no longer used, or
   document manual `npx lint-staged` only.

## Reference

Podverse: `scripts/git-hooks/install-hooks.sh`

## Verification

```bash
bash scripts/git-hooks/install-hooks.sh
ls -la "$(git rev-parse --git-path hooks)"
```
