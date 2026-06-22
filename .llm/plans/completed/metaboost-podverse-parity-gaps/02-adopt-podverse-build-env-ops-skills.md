# 02 — Adopt Podverse build and env ops skills

## Scope

Generic build/env/process skills from Podverse. Overlapping **rules** (`startup-validation-env-order`,
`build-order-doc-sync`, `config-type-safety`) are handled in `metaboost-abcmemory-align/01`.

## ADOPT

| Skill | Notes |
| --- | --- |
| `build-order` | MB package build order; pairs with `build-order-doc-sync` rule |
| `startup-validation-env-order` | Pairs with same-named rule; MB validation script paths |
| `env-defaults-match-code` | Env template ↔ code parity |
| `native-deps-platform-mismatch` | Lockfile Linux/darwin; pairs with `LOCKFILE-LINUX.md` |

## N/A (Podverse-only)

| Item | Rationale |
| --- | --- |
| `linear-sql-greenfield-only` | Podverse linear migration policy variant |
| `linear-baseline-0003` rule | MB uses `linear-baseline-gz-sync` skill instead |

## Steps

1. Port each skill; replace `@podverse` → `@metaboost`, doc paths, package lists.
2. Cross-link `linear-baseline-gz-sync` in `build-order` / infra docs.

## Verification

```bash
test -f .cursor/skills/build-order/SKILL.md && echo ok
```
