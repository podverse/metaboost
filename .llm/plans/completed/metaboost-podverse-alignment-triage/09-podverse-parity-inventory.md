# 09 — Podverse Parity Inventory (bidirectional)

## Scope

A full bidirectional inventory of **process / ops / LLM standards** between Podverse (source of
truth) and MetaBoost. Runs in Phase 2, after the theme triages (01–08) so it can absorb any
PARITY-GAP rows they surfaced. Output: a consolidated stage-2 plan set
`.llm/plans/active/metaboost-podverse-parity-gaps/` for the gaps that are accepted as in-scope for
MetaBoost.

This plan looks at `.cursor` rules/skills, CI workflows, Makefiles, scripts, docs structure, and
infra conventions in **both directions**.

## Method

1. Recompute the deltas (seeded below) at execution time, since other branches may have moved them:
   - `comm -23 <(ls podverse/.cursor/skills|sort) <(ls metaboost/.cursor/skills|sort)` and the
     reverse; same for `.cursor/rules`.
2. For each Podverse-only rule/skill, classify:
   - **ADOPT** — generic process/ops/LLM standard MetaBoost should emulate.
   - **N/A** — Podverse-product-specific (e.g. media player, add-by-rss, workers, lighthouse) with no
     MetaBoost analogue.
3. For each MetaBoost-only rule/skill, classify:
   - **MB-SPECIFIC** — legitimately MetaBoost-only (keep).
   - **PROMOTE-TO-PODVERSE** — generic enough that Podverse should arguably adopt it (record as a
     note for the Podverse repo; do not edit Podverse from MetaBoost work).
4. Compare CI workflows, Makefiles, `scripts/`, `docs/` top-level structure for process/ops parity.
5. Produce the `metaboost-podverse-parity-gaps` stage-2 set listing only ADOPT items (+ any
   PARITY-GAP rows from 01–08), each as a focused work item.

## Seeded delta — `.cursor/rules`

Podverse-only rules (candidate ADOPT vs N/A):

| Rule                                   | Suggested class | Rationale                                      |
| -------------------------------------- | --------------- | ---------------------------------------------- |
| `operator-only-git-operations`         | ADOPT           | Core agent/ops policy; MetaBoost lacks it        |
| `plan-lifecycle`                       | ADOPT?          | Compare to MB `plan-execution-completion-tracking`|
| `commands-from-monorepo-root`          | N/A (have)      | MB has `commands-from-metaboost-root` equivalent  |
| `documentation-updates`                | ADOPT           | Generic docs-maintenance standard                 |
| `github-actions-yaml`                  | ADOPT           | CI/ops standard; pairs with Plan 05               |
| `test-timeout-budget`                  | ADOPT           | Test/ops standard                                 |
| `startup-validation-env-order`         | ADOPT           | Env/ops standard (also a skill)                   |
| `openapi-sync`                         | ADOPT?          | MB has `swagger-openapi` skill; check overlap      |
| `config-type-safety`                   | ADOPT           | Config/env standard                               |
| `build-order-doc-sync`                 | ADOPT?          | Build/ops; MB has no build-order skill             |
| `infra-k8s`                            | ADOPT           | Infra/ops standard; pairs with Plan 06            |
| `linear-baseline-0003`                 | ADOPT?          | MB has `linear-baseline-gz-sync`; check overlap    |
| `shared-ui-i18n`                       | ADOPT?          | UI/i18n standard                                  |
| `prefer-shared-ui-web-management`      | ADOPT?          | UI standard; MB has `reusable-components`          |
| `extensions-env`                       | N/A?            | Check if MB has extensions concept                 |
| `e2e-seed-id-text-limits`              | ADOPT?          | E2E standard                                       |
| `ui-change-e2e-screenshot-report`      | ADOPT?          | MB has `end-with-targeted-make-report-verify`      |
| `app-internal-import-aliases`          | ADOPT?          | Import standard                                    |
| `typescript-express`                   | ADOPT?          | MB has `api` skill; check overlap                  |
| `i18n-management`                      | ADOPT?          | MB has `i18n` skill + `i18n-locale-language` rule  |
| `management-web-*`, `navbar-sticky-chrome`, `font-preloads-route-aware`, `custom-themes-operator-sample-sync` | N/A? | Likely Podverse-product-specific; confirm |

MetaBoost-only rules (MB-SPECIFIC vs PROMOTE):

| Rule                                    | Suggested class | Rationale                                       |
| --------------------------------------- | --------------- | ----------------------------------------------- |
| `api-no-pii-credentials-in-responses`   | PROMOTE?        | Security standard; Podverse may want it           |
| `commands-from-metaboost-root`          | MB-SPECIFIC     | Mirror of Podverse's monorepo-root rule           |
| `i18n-locale-language`                  | MB-SPECIFIC?    | Overlaps Podverse `i18n-management`               |
| `path-casing-imports`                   | PROMOTE?        | Generic cross-platform safety                     |
| `plan-execution-completion-tracking`    | MB-SPECIFIC     | Overlaps Podverse `plan-lifecycle`                |
| `single-readme`                         | MB-SPECIFIC?    | Repo-structure choice                             |

## Seeded delta — `.cursor/skills`

Podverse-only skills that are **generic process/ops/LLM** (candidate ADOPT): `build-order`,
`parallel-plan-execution`, `plan-completion`, `startup-validation-env-order`,
`unit-test-priority-confident`, `unit-test-new-code-gate`, `unit-test-design-no-overgranularity`,
`env-defaults-match-code`, `git-worktree-sibling`, `github`, `logging`, `observability`,
`native-deps-platform-mismatch`, `ui-e2e-screenshot-report`, `ui-component-promotion`,
`modal-layout-contract`, `styles-source-of-truth`, `styles-import-last`, `time-format-local`,
`rate-limit-message`, `routing-url-params`.

Podverse-only skills that are **product-specific (N/A)**: `add-by-rss-components-sync`,
`add-by-rss-parity-sync`, `media-player-architecture`, `workers`, `bundle-optimization`,
`lighthouse-docker-sync`, `lighthouse-env-alignment`, `header-hero-image-sources`,
`integrations-web`, `management-api`, `orm`, `linear-sql-greenfield-only`,
`e2e-membership-state-matrix`, `e2e-seed-nano-id-limits`, `form-primary-actions-row`.

MetaBoost-only skills (mostly MB-SPECIFIC or finer-grained variants of Podverse rules):
`argocd-gitops-push`, `avoid-line-height`, `avoid-unknown-types`, `avoid-unused-props-vars`,
`avoid-wrapper-elements`, `button-loading-async`, `catch-unused-error`, `database-schema-naming`,
`e2e-permission-actor-matrix`, `focus-outline-visible`, `generate-data-sync`,
`helpers-requests-req-pattern`, `i18n`, `linear-baseline-gz-sync`, `linear-db-migrations`,
`local-docker-env-alignment`, `management-edit-breadcrumbs`, `management-edit-page-tabs`,
`nested-resource-prefix-naming`, `password-strength-on-set-update`, `path-casing-imports`,
`plan-files-convention`, `roles-schema-sync`, `single-focus-indicator`, `storybook-component-docs`,
`swagger-openapi`, `tab-active-state-url-match`, `typeorm-orderby-property-names`,
`unit-tests-confident-granularity`, `unit-tests-risk-first`, `use-form-component`. Several are
PROMOTE candidates for Podverse (e.g. `argocd-gitops-push`, `linear-baseline-gz-sync`).

Note: `INDEX.md` appears as a "skill" only because it sits in the skills dir — exclude it.

## Other parity dimensions to check at execution

- CI: jobs/gates Podverse runs that MetaBoost does not (feeds from Plan 05).
- Makefiles: targets/conventions present in Podverse but missing in MetaBoost.
- `scripts/`: dev/ops helpers present in one repo only (feeds from Plan 07).
- `docs/` top-level structure and AGENTS.md sections.

## Stage-2 output

Create `.llm/plans/active/metaboost-podverse-parity-gaps/` with:

- `00-SUMMARY.md` / `00-EXECUTION-ORDER.md`
- One numbered plan per accepted ADOPT cluster (e.g. `01-ops-git-policy-rules.md`,
  `02-ci-and-infra-standards.md`, `03-testing-standards.md`, `04-build-and-config-standards.md`).
- A `PROMOTE-TO-PODVERSE-NOTES.md` capturing MetaBoost-only items worth proposing back to Podverse
  (informational; not executed against the Podverse repo from here).
- `COPY-PASTA.md`.

Record N/A and MB-SPECIFIC classifications in this file's Decisions section so they are not
re-litigated.

## Decisions

**Executed:** 2026-06-21  
**Method:** Recomputed `comm` deltas on `.cursor/rules` and `.cursor/skills`; merged PARITY-GAP rows
from Plans 01–08; compared workflows, `scripts/ci/`, Makefiles.

### Podverse-only rules — classification

| Rule | Class | Notes |
| --- | --- | --- |
| `operator-only-git-operations` | **ADOPT** | → `metaboost-abcmemory-align/01` |
| `documentation-updates` | **ADOPT** | → abcmemory-align |
| `github-actions-yaml` | **ADOPT** | → abcmemory-align; pairs with ci-ops-align |
| `test-timeout-budget` | **ADOPT** | → abcmemory-align |
| `startup-validation-env-order` | **ADOPT** | → abcmemory-align + parity-gaps plan 02 skill |
| `config-type-safety` | **ADOPT** | → abcmemory-align |
| `build-order-doc-sync` | **ADOPT** | → abcmemory-align + parity-gaps plan 02 skill |
| `infra-k8s` | **ADOPT** | → abcmemory-align |
| `plan-lifecycle` | **ADOPT** | Reconcile with MB `plan-execution-completion-tracking` |
| `openapi-sync` | **ADOPT** | → abcmemory-align; cross-link `swagger-openapi` skill |
| `shared-ui-i18n`, `prefer-shared-ui-web-management` | **ADOPT** | → abcmemory-align |
| `app-internal-import-aliases` | **ADOPT** | → parity-gaps plan 04 |
| `e2e-seed-id-text-limits` | **ADOPT** | → parity-gaps plan 01 |
| `typescript-express` | **N/A** | MB `api` skill covers Express patterns |
| `ui-change-e2e-screenshot-report` | **N/A** | Overlaps MB `end-with-targeted-make-report-verify` |
| `i18n-management` | **N/A** | MB `i18n` skill + `i18n-locale-language` rule |
| `linear-baseline-0003` | **N/A** | MB `linear-baseline-gz-sync` skill |
| `extensions-env` | **N/A** | No MB extensions sidecar model |
| Product UI rules (themes, navbar, management-web-*, font-preloads) | **N/A** | Podverse product |
| `commands-from-monorepo-root` | **N/A** | MB has `commands-from-metaboost-root` |

### Podverse-only skills — classification

| Skill | Class |
| --- | --- |
| `build-order`, `startup-validation-env-order`, `env-defaults-match-code`, `native-deps-platform-mismatch` | **ADOPT** → parity-gaps 02 |
| `logging`, `observability`, `github`, `git-worktree-sibling`, `parallel-plan-execution`, `plan-completion` | **ADOPT** → parity-gaps 03 |
| `unit-test-*` (3 skills) | **ADOPT** → parity-gaps 01 |
| Modal/styles/UI skills (8 listed in plan 04) | **ADOPT** → parity-gaps 04 |
| Product skills (add-by-rss, workers, orm, lighthouse, media-player, etc.) | **N/A** |
| `css-custom-properties-no-var-fallbacks` skill | **N/A** | MB has same-named rule |

### MetaBoost-only — classification

| Item | Class |
| --- | --- |
| `commands-from-metaboost-root`, `plan-execution-completion-tracking`, `i18n-locale-language`, `single-readme`, `INDEX.md` | **MB-SPECIFIC** |
| `api-no-pii-credentials-in-responses`, `path-casing-imports`, `argocd-gitops-push`, `linear-baseline-gz-sync`, `plan-files-convention`, UI/a11y skills | **PROMOTE** → `PROMOTE-TO-PODVERSE-NOTES.md` |

### PARITY-GAP from Plans 01–08 (deduped)

| Item | Disposition |
| --- | --- |
| Process rules (Plan 03) | `metaboost-abcmemory-align` |
| CI workflows (Plans 04–05) | `metaboost-ci-ops-align` |
| Infra env (Plan 06) | `metaboost-infra-env-align` |
| Git hooks (Plan 07) | `metaboost-dev-scripts-align` |
| Build/eslint/vitest (Plan 08) | `metaboost-build-config-align` |
| `run-workspaces.mjs` (Plan 08) | `metaboost-podverse-parity-gaps/05` |
| `eslint-plugin-perfectionist` vs `simple-import-sort` | **MB-SPECIFIC** (intentional) |

### CI / scripts / Makefiles

| Dimension | Class |
| --- | --- |
| PV-only workflows `complete-feature`, `vulnerability-scanner` | **ADOPT** → ci-ops-align |
| MB-only workflows signing + alpha-contracts | **KEEP** |
| PV-only Makefiles (v4v, extensions, alpha Jenkins) | **N/A** |
| Missing `scripts/ci/` in MB | **ADOPT** run-workspaces |

**Stage-2 spawned:** `.llm/plans/active/metaboost-podverse-parity-gaps/`
