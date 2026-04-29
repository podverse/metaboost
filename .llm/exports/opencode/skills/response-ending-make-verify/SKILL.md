---
name: response-ending-make-verify
description: End implementation responses with scoped make-based screenshot report commands for web and management-web verification.
version: 1.4.0
---


# Response-Ending Make Verification

The Cursor rule `end-with-targeted-make-report-verify` enforces this behavior; this skill is the extended reference (command tree, API gate, multi-spec).

Use this skill when answering implementation requests in this repo.

## Do not run tests during agent or plan work

- **Never run test or verification commands** (e.g. `make e2e_test_web`, `npm run test`, `make e2e_test_web_signup_enabled`) as part of your agent or plan implementation work.
- **Only instruct the user** to run those commands after your work is done. Provide the exact command(s) in a fenced `bash` block so the user can copy and run them.
- This keeps agent sessions fast, avoids flaky runs in automation, and leaves verification to the user in their environment.

## Required response behavior

1. Give the user a runnable make command they can copy and run to verify the change; include it in a fenced `bash` code block at the end of the response.
2. End every implementation response with one or more runnable `make` commands.
3. Do not suggest direct Playwright execution (`npx playwright test ...` or `npm run test:e2e -w ...`) for standard E2E verification; use the `make` wrappers so seed/setup is included.
4. **E2E-affected changes (mandatory):** If the change affects E2E tests in any way (e.g. you modified UI in apps/web or apps/management-web, or you added/edited files under `apps/web/e2e/` or `apps/management-web/e2e/`), you **MUST** end the response with a fenced `bash` block containing the **EXACT** command(s) the user needs to run to E2E-verify that change. No exception. Use the specific spec path(s) that cover the changed behavior (e.g. `make e2e_test_web_report_spec SPEC=e2e/settings-bucket-owner.spec.ts`). This is non-negotiable.
5. Prefer feature-scoped screenshot report commands over full-suite commands.
6. Choose the smallest command set that verifies the changed behavior.
7. Only recommend full-suite report mode when scope is broad or cross-cutting.
8. Render final verification commands inside a fenced `bash` code block so the UI shows a copy button.
9. Inside the fenced block, keep one command per line and avoid bullets/backticks.

## Command selection decision tree

- Web-only feature (single page/flow):
  - `make e2e_test_web_report_spec SPEC=e2e/<web-spec>.spec.ts`
- Signup-enabled web flows (duplicate email, successful signup redirect):
  - `make e2e_test_web_signup_enabled`
- Management-web-only feature (single page/flow):
  - `make e2e_test_management_web_report_spec SPEC=e2e/<management-spec>.spec.ts`
- Cross-app feature touching both web and management-web:
  - `make e2e_test_report_scoped WEB_SPEC=e2e/<web-spec>.spec.ts MGMT_SPEC=e2e/<management-spec>.spec.ts`
- Lightweight broad smoke check:
  - `make e2e_test_home_report`
- Broad regression or pre-deploy confidence (four reports: one per web auth mode + management-web):
  - `make e2e_test_report`

## API gate: default is no API tests (required)

- **Default (no env var):** E2E commands **do not run** API integration tests. The Makefile default is `E2E_API_GATE_MODE=off`. When you give the user E2E verification commands, **always** give them without `E2E_API_GATE_MODE` so they get the default (skip API tests). This is required for all E2E-only verification.
- **Only when the change affected API tests:** If you modified API code, integration tests, auth, seed, or backend packages that could affect E2E outcomes, then give the user a command that **includes** API tests by prefixing with `E2E_API_GATE_MODE=on` (e.g. `make E2E_API_GATE_MODE=on e2e_test_web_report_spec SPEC=e2e/...`). Otherwise do **not** add the env var.
- **Optional:** User can pass `E2E_API_GATE_MODE=on` to run API tests before E2E; `E2E_API_GATE_MODE=auto` to run API tests only when changed files match API-impacting paths.

Examples (E2E-only, no API tests — use these by default):

- `make e2e_test_web_report_spec SPEC=e2e/<web-spec>.spec.ts`
- `make e2e_test_management_web_report_spec SPEC=e2e/<management-spec>.spec.ts`
- `make e2e_test_web_admin_only_email_report_spec SPEC=e2e/<spec>.spec.ts`

When API tests are needed (only if change affected API/integration tests):

- `make E2E_API_GATE_MODE=on e2e_test_web_report_spec SPEC=e2e/<web-spec>.spec.ts`
- `make E2E_API_GATE_MODE=on e2e_test_management_web_report_spec SPEC=e2e/<management-spec>.spec.ts`
- `make E2E_API_GATE_MODE=on e2e_test_report_scoped WEB_SPEC=... MGMT_SPEC=...`

Multi-spec input:

- `SPEC`, `WEB_SPEC`, and `MGMT_SPEC` support comma-separated values.
- Example:
  - `make e2e_test_web_report_spec SPEC=e2e/buckets.spec.ts,e2e/invite.spec.ts`
  - `make e2e_test_report_scoped WEB_SPEC=e2e/buckets.spec.ts,e2e/bucket-detail.spec.ts MGMT_SPEC=e2e/buckets.spec.ts,e2e/events.spec.ts`

## Notes

- These report-mode targets capture step screenshots and write timestamped HTML reports in `.artifacts/e2e-reports/`.
- API gate: default is `off` (no API tests). Pass `E2E_API_GATE_MODE=on` to include API integration tests; `E2E_API_GATE_MODE=auto` for conditional run based on changed files.
- If a response includes non-UI/API-internal work, still end with the nearest relevant verification command and briefly explain why it is the best available check.
- If a verification command requires interactive input, stop and hand off using the **interactive-prompts** skill.
