---
description: "Always provide runnable commands from Metaboost repo root."
applyTo: "**"
---

# Commands From Metaboost Root

Always provide runnable terminal commands relative to the Metaboost repository root.

## Do

- Use root-invoked workspace commands (for example `npm run <script> -w @metaboost/<workspace> -- [args]`).
- For E2E commands, use `make` targets from repo root so dependencies and seed steps are handled.
- Use `SPEC`/`WEB_SPEC`/`MGMT_SPEC` for one spec or comma-delimited spec lists.
- Put runnable commands in fenced `bash` blocks so the editor shows copy buttons.

## Don't

- Do not instruct users to `cd apps/api`, `cd apps/web`, or `cd apps/management-web` before running commands.
- Do not provide commands that only work from subdirectories unless explicitly requested.
- Do not suggest direct Playwright invocation (`npx playwright test`, `npm run test:e2e ...`) for Metaboost E2E runs.

## Example

```bash
make e2e_test_management_web_report_spec SPEC=e2e/dashboard-super-admin-full-crud.spec.ts
make e2e_test_management_web_report_spec SPEC=e2e/dashboard-super-admin-full-crud.spec.ts,e2e/login-super-admin-full-crud.spec.ts
```
