# Metaboost Cursor skills

Skills are invoked when the task matches their "when to use" scope. **For task → skill mapping, see [AGENTS.md](/AGENTS.md) § When to use which skill.**

## Quick reference

| Directory                       | When to use                                                                                                |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| api                             | Express API patterns                                                                                       |
| api-testing                     | Adding/changing API routes, auth, or integration tests                                                     |
| argocd-gitops-push              | Changing infra/k8s/ or k8s sync targets; add push reminder                                                 |
| docker-runtime-workspace-parity | New/changed `packages/*`, `@metaboost/*` app deps, `infra/docker/local/**` Dockerfiles, container errors   |
| linear-db-migrations            | `infra/k8s/base/db/source/`, ops migration jobs, `scripts/database/`, admin env keys                       |
| llm-cursor-source               | What to commit under `.cursor/`, `.cursorrules`, and `.cursorignore`                                       |
| plan-files-convention           | Creating, saving, or completing multi-step plans (COPY-PASTA)                                              |
| single-readme                   | Adding index/overview docs – repo has only one README.md at root                                           |
| web                             | Next.js app patterns                                                                                       |
| e2e-page-tests                  | Layout or behavior changes in web/management-web                                                           |
| response-ending-make-verify     | Ending implementation responses with E2E make commands                                                     |
| ui-e2e-screenshot-report        | Targeted screenshot report after UI changes; report paths under `.artifacts/e2e-reports/`                  |
| styles-source-of-truth          | Design tokens and themes in `packages/ui/src/styles/`                                                      |
| modal-layout-contract           | `Modal` / `ModalDialogContent` dialog footer and overflow rules                                            |
| ui-component-promotion          | Extract shared UI from web + management-web into `@metaboost/ui`                                           |
| reusable-components             | Prefer `@metaboost/ui` over app-local duplicates                                                           |
| i18n                            | Translation keys, locales, generating translations                                                         |
| management-post-save-navigation | Dedicated management-web create/edit one-row pages; list redirect after primary save (exceptions in skill) |
| k8s                             | `infra/k8s/` Kustomize bases vs overlays; shared bundles only in overlays with matching `?ref=`            |
| path-casing-imports             | Relative imports or CI module-not-found (casing)                                                           |
| import-specifiers-tiered        | Tier A `.js` vs Tier B extensionless Next `src`; codemods or cross-tier import edits                       |

Other skills in this directory cover forms, tables, DB/ORM, management-web CRUD, documentation, and style. Rules (`.cursor/rules/*.mdc`) apply automatically by glob or always; see AGENTS.md.
