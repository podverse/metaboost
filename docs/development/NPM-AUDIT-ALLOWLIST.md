# NPM Audit Allowlist

## Overview

Release and promote scripts call [scripts/lib/check-audit-gate.sh](/scripts/lib/check-audit-gate.sh),
which fails on **moderate and higher** npm audit findings unless an advisory ID allowlist is passed.

**Current state (strict mode):** All publish scripts pass an **empty** allowlist (`""`). No advisory
IDs are allowlisted. `bump-version.sh` and the `sync-*` promote scripts block on any disallowed
moderate+ finding.

Podverse allowlists advisory **1117015** (`postcss` nested under `next`) in the same scripts because
root overrides do not replace `next`'s nested `node_modules/postcss@8.4.31`. Metaboost keeps strict
mode until an advisory is investigated and documented here.

## Strict mode rationale (2026-06 review)

`bash scripts/lib/check-audit-gate.sh "" release` on the current lockfile:

- **1117015 is not reported** — root `"postcss": "^8.5.10"` override appears sufficient for
  Metaboost's lockfile layout (no Podverse-style nested postcss gap at review time).
- **Release is still blocked** by other moderate+ advisories (for example `next`, `nodemailer`,
  `typeorm`, `joi`, `qs`, `brace-expansion`, `ip-address`). Those require dependency upgrades or
  targeted overrides — not silent allowlisting.

Do **not** copy Podverse's `1117015` allowlist unless investigation confirms the same nested
`postcss` chain and documents why upgrades or overrides cannot fix it.

## When to add an allowlist entry

An advisory should be allowlisted only when:

1. **Root cause verified:** Investigation confirmed the advisory comes from transitive dependencies with no safe upgrade path
2. **Upstream constraint is real:** Latest versions of all upstream packages still carry the vulnerability
3. **Fix would cause regressions:** Upgrading would require downgrading other critical packages
4. **Risk is acceptable:** The vulnerability is transitive-only and not directly exploitable in Metaboost's deployment model
5. **Clear revisit path exists:** A specific upstream package version milestone will resolve it

Pass comma-separated npm advisory `source` IDs as the first argument to `check-audit-gate.sh` in:

- [scripts/publish/bump-version.sh](/scripts/publish/bump-version.sh)
- [scripts/publish/sync-develop-to-staging.sh](/scripts/publish/sync-develop-to-staging.sh)
- [scripts/publish/sync-staging-to-main.sh](/scripts/publish/sync-staging-to-main.sh)

Keep all call sites **in sync**.

## How to add an entry

### Step 1: Investigate (see `.cursor/skills/npm-audit/SKILL.md`)

```bash
npm audit --omit=dev --json | jq '.vulnerabilities'
```

Trace the dependency chain:

```bash
npm ls <vulnerable-package> --all
```

### Step 2: Document why

Add a subsection under **Current allowlisted advisories** with chain, rationale, risk, and revisit triggers.

### Step 3: Update publish scripts

Example (Podverse pattern for nested postcss — only if investigation confirms the same issue):

```bash
"$SCRIPT_DIR/../lib/check-audit-gate.sh" "1117015" "release"
```

### Step 4: Update root npm overrides (if applicable)

If applicable, add root-level overrides in `package.json` before allowlisting.

## Current allowlisted advisories

(None. Strict mode — empty allowlist in all publish scripts.)

## References

- npm docs: [Dependency overrides](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#overrides)
- `.cursor/skills/npm-audit/SKILL.md` — investigation procedures
- Podverse reference: `docs/development/security/NPM-AUDIT-ALLOWLIST.md` (1117015 pattern)
