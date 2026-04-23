# NPM Audit Allowlist

## Overview

The `scripts/publish/bump-version.sh` script can include a security allowlist for specific npm audit advisories that cannot be resolved through normal package upgrades or npm overrides. This document explains the pattern and when to use it.

## When to Add an Allowlist Entry

An advisory should be allowlisted only when:

1. **Root cause verified:** Investigation confirmed the advisory comes from transitive dependencies with no safe upgrade path
2. **Upstream constraint is real:** Latest versions of all upstream packages still carry the vulnerability
3. **Fix would cause regressions:** Upgrading would require downgrading other critical packages
4. **Risk is acceptable:** The vulnerability is transitive-only and not directly exploitable in Metaboost's deployment model
5. **Clear revisit path exists:** A specific upstream package version milestone will resolve it

## How to Add an Entry

### Step 1: Investigate (see `.github/skills/npm-audit/SKILL.md`)

```bash
npm audit --omit=dev --json | jq '.vulnerabilities'
```

Trace the dependency chain:

```bash
npm ls <vulnerable-package> --all
```

### Step 2: Document Why

Update this file with an entry like:

```markdown
### Advisory XXXXX: <vulnerability name>

**Affected chain:** pkg1 → pkg2 → pkg3 → vulnerable-pkg

**Why it's allowlisted:**
- Latest pkg3@X.Y still pins vulnerable-pkg@<14
- Downgrading pkg1 causes regressions (list them)
- Replacing pkg1 would require major refactor

**Risk level:** Transitive-only; not directly exploitable because [reason].

### When to revisit:
- When pkg1 releases X+1.0.0 with upgraded dependencies
- When pkg3 releases Y+1.0.0 that drops the vulnerable dep
```

### Step 3: Update bump-version.sh

Add the advisory ID to `ALLOWED_AUDIT_IDS` in `scripts/publish/bump-version.sh`:

```bash
ALLOWED_AUDIT_IDS="1113977,1116970"  # See docs/development/NPM-AUDIT-ALLOWLIST.md
```

### Step 4: Update Root npm Overrides

If applicable, add root-level overrides in `package.json`:

```json
{
  "overrides": {
    "uuid": "14.0.0",
    "@tootallnate/once": "3.0.1"
  }
}
```

## Current Allowlisted Advisories

(None currently. When an advisory needs to be allowlisted, add it here with full details.)

## References

- npm docs: [Dependency overrides](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#overrides)
- `.github/skills/npm-audit/SKILL.md` — Full investigation procedures
- `scripts/publish/bump-version.sh` — Implementation
