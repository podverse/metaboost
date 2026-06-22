# 01 — Adopt Podverse CI workflows

## Scope

Add MetaBoost copies of Podverse workflows missing after export/changelog cleanup.

## Workflows to add

| Podverse workflow | Action |
| --- | --- |
| `complete-feature.yml` | Adapt for MetaBoost (`.llm/history/` paths, `develop` branch). Coordinate with `metaboost-llm-workspace-align` plan 04 — avoid duplicate work. |
| `vulnerability-scanner.yml` | Port scheduled npm audit scan; use MB audit gate docs (`NPM-AUDIT-ALLOWLIST.md`). |

## Do not add

- `llm-exports-*.yml` (removed; Plan 01 KEEP)

## MB-only (keep)

- `publish-metaboost-signing.yml`
- `metaboost-infra-alpha-contracts.yml`

## Verification

```bash
test -f .github/workflows/vulnerability-scanner.yml && echo ok
```
