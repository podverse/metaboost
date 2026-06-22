# 01 — Adopt Podverse process rules

## Scope

Add MetaBoost copies of **generic** Podverse rules that triage Plan 03 marked PARITY-GAP. Source files
live under `podverse/.cursor/rules/`. Adapt only repo-specific strings (`Podverse` → `Metaboost`,
`@podverse/*` → `@metaboost/*`, doc paths).

## Rules to add

Copy from Podverse and adapt:

| Podverse rule | Adapt notes |
| --- | --- |
| `operator-only-git-operations.mdc` | Change Publish workflow names to MetaBoost staging/main |
| `documentation-updates.mdc` | Update doc path examples to MB tree |
| `github-actions-yaml.mdc` | Reference MB `.github/workflows/` |
| `test-timeout-budget.mdc` | MB make/e2e targets |
| `startup-validation-env-order.mdc` | MB app validation scripts paths |
| `config-type-safety.mdc` | MB `apps/*/src/config` layout |
| `build-order-doc-sync.mdc` | MB package build order |
| `infra-k8s.mdc` | MB `infra/k8s/` paths |
| `plan-lifecycle.mdc` | **Reconcile** with existing `plan-execution-completion-tracking.mdc` — merge into one always-applied rule or cross-link; do not duplicate conflicting guidance |
| `openapi-sync.mdc` | Cross-link MB `swagger-openapi` skill; avoid duplicate OpenAPI policy |
| `shared-ui-i18n.mdc` | `@metaboost/ui`; apps `web` + `management-web` |
| `prefer-shared-ui-web-management.mdc` | Same adaptation |

## Do not add (N/A for MetaBoost)

Podverse-product-specific: `extensions-env`, `custom-themes-operator-sample-sync`,
`e2e-seed-id-text-limits`, `font-preloads-route-aware`, `navbar-sticky-chrome`,
`management-web-form-eyebrow`, `management-web-tables`, `linear-baseline-0003` (MB uses
`linear-baseline-gz-sync` skill instead — note in `infra-k8s` cross-ref).

## Steps

1. For each rule above, read Podverse source, adapt strings, write to `metaboost/.cursor/rules/`.
2. Update `CURSOR-RULES.md` only if it should list new always-applied rules (optional one-line note).
3. Ensure `AGENTS.md` § When to use which skill references new rules where relevant.

## Verification

```bash
test -f .cursor/rules/operator-only-git-operations.mdc && echo ok
npm run lint
```
