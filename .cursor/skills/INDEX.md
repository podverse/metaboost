# Boilerplate Cursor skills

Skills are invoked when the task matches their "when to use" scope. **For task → skill mapping, see [AGENTS.md](../../AGENTS.md) § When to use which skill.**

## Quick reference

| Directory                   | When to use                                                      |
| --------------------------- | ---------------------------------------------------------------- |
| api                         | Express API patterns                                             |
| api-testing                 | Adding/changing API routes, auth, or integration tests           |
| argocd-gitops-push          | Changing infra/k8s/ or k8s sync targets; add push reminder       |
| llm-history                 | Updating history or starting feature work                        |
| plan-files-convention       | Creating, saving, or completing multi-step plans (COPY-PASTA)    |
| single-readme               | Adding index/overview docs – repo has only one README.md at root |
| web                         | Next.js app patterns                                             |
| e2e-page-tests              | Layout or behavior changes in web/management-web                 |
| response-ending-make-verify | Ending implementation responses with E2E make commands           |
| i18n                        | Translation keys, locales, generating translations               |
| path-casing-imports         | Relative imports or CI module-not-found (casing)                 |

Other skills in this directory cover forms, tables, DB/ORM, management-web CRUD, documentation, and style. Rules (`.cursor/rules/*.mdc`) apply automatically by glob or always; see AGENTS.md.
