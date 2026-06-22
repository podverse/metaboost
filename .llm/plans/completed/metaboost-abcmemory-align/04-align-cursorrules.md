# 04 — Align `.cursorrules` with Podverse

## Scope

Merge Podverse LLM workflow sections into MetaBoost `.cursorrules` while keeping MetaBoost-specific
content.

## Add from Podverse (adapt)

- **Commands / Terminal** — commands-from-repo-root (reference `commands-from-metaboost-root` rule).
- **Issue linking** — ask once for related GitHub issue.
- **Operator-only git and publish** — reference new `operator-only-git-operations` rule.
- Richer **Code Quality** bullets where they apply (`import type`, tiered import specifiers doc link).

## Keep MetaBoost-specific

- `E2E_API_GATE_MODE=off` default in agent/plan work section.
- MetaBoost stack/architecture references (`@metaboost/*` not `@podverse/*`).
- No Podverse-only sections: shared UI promotion to `@podverse/ui`, workers commands, etc.

## Steps

1. Diff `metaboost/.cursorrules` vs `podverse/.cursorrules`.
2. Merge missing process sections; do not bloat with product-specific Podverse-only bullets.
3. Ensure abcmemory / abcremember vocabulary matches `abcmemory-vocabulary` rule.

## Verification

```bash
grep -n "operator-only\|E2E_API_GATE" .cursorrules
npm run lint
```
