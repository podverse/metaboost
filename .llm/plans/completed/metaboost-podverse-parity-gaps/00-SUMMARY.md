# MetaBoost ↔ Podverse parity gaps — Summary

## Purpose

Consolidated stage-2 plan set for **accepted ADOPT items** from triage Plan 09 and PARITY-GAP rows
from Plans 01–08 that are **not** already covered by other active stage-2 sets.

## Execute other stage-2 sets first

| Set | Covers |
| --- | --- |
| `metaboost-llm-exports-reference-cleanup/` | Stale ESLint `scripts/llm` glob |
| `metaboost-abcmemory-align/` | Missing process **rules**, drifted shared rules/skills, `.cursorrules` |
| `metaboost-llm-workspace-align/` | `.llm/` docs, complete-feature doc refs |
| `metaboost-ci-ops-align/` | `complete-feature.yml`, `vulnerability-scanner.yml`, `ci.yml` gates |
| `metaboost-infra-env-align/` | K8s env sources, linear baseline gz |
| `metaboost-dev-scripts-align/` | Git hooks, bump-version audit, dev scripts |
| `metaboost-build-config-align/` | ESLint stale globs, vitest wiring, lint-staged |

**This set** adds Podverse **skills** and **tooling** MetaBoost lacks, plus records N/A / PROMOTE
classifications so they are not re-litigated.

## Plans in this set

| File | Focus |
| --- | --- |
| 01-adopt-podverse-testing-standards.md | Unit-test skills + `e2e-seed-id-text-limits` |
| 02-adopt-podverse-build-env-ops-skills.md | `build-order`, env/startup/native-deps skills |
| 03-adopt-podverse-engineering-ops-skills.md | logging, observability, github, git-worktree, plan skills |
| 04-adopt-podverse-ui-shared-standards.md | Modal/styles/UI promotion + import alias rule |
| 05-adopt-run-workspaces-ci-script.md | `scripts/ci/run-workspaces.mjs` + `test:unit` |
| `PROMOTE-TO-PODVERSE-NOTES.md` | MB-only items worth proposing to Podverse (informational) |

## Verification

```bash
comm -23 <(ls ../podverse/.cursor/skills | sort) <(ls .cursor/skills | sort) | grep -v INDEX
./scripts/nix/with-env npm run test:unit
```
