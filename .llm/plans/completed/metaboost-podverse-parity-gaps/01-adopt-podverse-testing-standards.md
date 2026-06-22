# 01 — Adopt Podverse testing standards

## Scope

Podverse-only **generic** testing guidance MetaBoost lacks. `test-timeout-budget` **rule** is adopted
via `metaboost-abcmemory-align/01` — this plan adds **skills** and one E2E rule.

## ADOPT

| Item | Source | Notes |
| --- | --- | --- |
| `unit-test-priority-confident` skill | Podverse | Map to MB `unit-tests-risk-first` — merge or adopt PV naming |
| `unit-test-new-code-gate` skill | Podverse | Complements MB unit-test skills |
| `unit-test-design-no-overgranularity` skill | Podverse | Complements MB `unit-tests-confident-granularity` |
| `e2e-seed-id-text-limits` rule | Podverse | Generic E2E seed/id contract; adapt MB seed paths |

## Reconcile (do not duplicate)

| MB existing | Action |
| --- | --- |
| `unit-tests-risk-first`, `unit-tests-confident-granularity` | Cross-link or merge with Podverse trio above |
| `e2e-permission-actor-matrix` | **KEEP** MB-specific; N/A Podverse counterpart |

## Steps

1. Port each skill from Podverse; adapt make targets and package names.
2. Add `e2e-seed-id-text-limits.mdc` adapted for MetaBoost E2E seed.
3. Update `AGENTS.md` skills table.

## Verification

```bash
test -d .cursor/skills/unit-test-new-code-gate && echo ok
```
