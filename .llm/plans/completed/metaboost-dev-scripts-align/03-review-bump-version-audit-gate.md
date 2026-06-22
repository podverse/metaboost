# 03 — Review bump-version audit gate

## Scope

Podverse `bump-version.sh` passes advisory allowlist `"1117015"` to `check-audit-gate.sh` (Next/postcss
nested dep). MetaBoost passes `""` (strict — no allowlist).

Changelog creation/removal is **KEEP** (Plan 02). Lockfile-linux step matches Podverse — **KEEP**.

Workspace discovery differs (Podverse: `jq` + `npm query`; MetaBoost: Node expansion script) — **KEEP**
if functionally equivalent for MB workspaces.

## Steps

1. Run bump-version dry path or audit gate on current lockfile.
2. If release blocked by advisory 1117015 (or MB equivalent), add documented allowlist to
   `bump-version.sh` and `docs/development/NPM-AUDIT-ALLOWLIST.md` matching Podverse pattern.
3. If strict mode is intentional for MetaBoost, document in `NPM-AUDIT-ALLOWLIST.md` — no script change.

## Verification

```bash
scripts/lib/check-audit-gate.sh "" release
```
