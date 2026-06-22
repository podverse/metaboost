# MetaBoost CI ops align — Summary

## Purpose

Align MetaBoost GitHub Actions, Dependabot, and repo-management docs with Podverse ops conventions
after triage Plan 05. Preserve MetaBoost-only workflows (`publish-metaboost-signing.yml`,
`metaboost-infra-alpha-contracts.yml`).

## Plans

| File | Focus |
| --- | --- |
| 01-adopt-podverse-ci-workflows.md | `complete-feature.yml`, `vulnerability-scanner.yml` |
| 02-align-ci-yml-gates.md | `ci.yml` — OpenAPI check, npm ci retries, step naming parity |
| 03-align-publish-and-dependabot.md | Publish workflows + `dependabot.yml` |
| 04-align-repo-management-docs.md | `docs/repo-management/*`, release doc cross-refs |

## Verification

```bash
rg -n "CHANGELOG|llm-exports" .github/workflows || echo "clean"
diff <(ls .github/workflows | sort) <(ls ../podverse/.github/workflows | sort)
```
