# Promote to Podverse — notes (informational)

MetaBoost-only process/ops items worth proposing in the **Podverse** repo. Do **not** edit Podverse
from MetaBoost workstreams; copy this list into a Podverse issue or PR when convenient.

## High priority (security / ops)

| Item | Type | Rationale |
| --- | --- | --- |
| `api-no-pii-credentials-in-responses` rule | rule | Safe API serialization (`userToJson`, no credential leaks) |
| `argocd-gitops-push` skill | skill | Reminder to push `infra/k8s/**` for GitOps sync |
| `path-casing-imports` rule + skill | rule/skill | Linux CI case-sensitivity for imports |
| `linear-baseline-gz-sync` skill | skill | Explicit gz regeneration workflow (PV has `linear-baseline-0003` rule) |

## Medium priority (DX / quality)

| Item | Type | Rationale |
| --- | --- | --- |
| `plan-files-convention` skill | skill | COPY-PASTA / 00-EXECUTION-ORDER layout (vs `plan-lifecycle` only) |
| `local-docker-env-alignment` skill | skill | Docker env parity with k8s templates |
| `helpers-requests-req-pattern` skill | skill | Shared HTTP client boundaries |
| `database-schema-naming` + `typeorm-orderby-property-names` | skills | ORM/DDL naming consistency |
| `storybook-component-docs` skill | skill | UI package Storybook conventions |
| `button-loading-async`, `use-form-component`, `password-strength-on-set-update` | skills | Form UX patterns |
| `focus-outline-visible`, `single-focus-indicator`, `avoid-line-height`, `avoid-wrapper-elements` | skills/rules | a11y/style constraints |
| `catch-unused-error` skill | skill | ESLint unused catch binding pattern |
| `e2e-permission-actor-matrix` skill | skill | Management E2E authz matrix |

## Lower priority / repo policy

| Item | Type | Rationale |
| --- | --- | --- |
| `single-readme` rule + skill | rule/skill | One README at repo root policy |
| `metaboost-infra-alpha-contracts.yml` workflow | workflow | Kustomize build CI for alpha overlay (adapt paths) |
| `scripts/env-overrides/` home override flow | scripts | Alternative to Podverse `local-env/prepare-overrides.sh` |

## Not promoted (MetaBoost-specific product)

`generate-data-sync`, `roles-schema-sync`, `nested-resource-prefix-naming`,
`management-edit-breadcrumbs`, `management-edit-page-tabs`, `tab-active-state-url-match`,
`publish-metaboost-signing.yml`, MB billing/membership docs.

## Bidirectional parity already shared

Both repos already have: `normalize-markdown-links.mjs`, `eslint-rules/require-relative-js-extension.mjs`,
tiered import-specifier enforcement, `.cursor/hooks/` + `.cursor/prompts/` (identical).
