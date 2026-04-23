### Session 1 - 2026-04-22

#### Prompt (Agent)

Continue the task: apply the E2E fix for `expectPostLoginDashboardVisible` (sortable column header accessible names) and verify with Playwright.

#### Key Decisions

- `getByRole('columnheader', { name: /^name$/i })` failed because `Table.SortableHeaderCell` puts the sort affordance in a child button with an `aria-label` like "Sort by Name. …", so the columnheader’s full accessible name is not the bare word "Name". Switched to substring regex matchers `/name/i` and `/type/i` and documented this in the helper JSDoc.
- Verified with `make e2e_test_web_report_spec SPEC=e2e/bucket-admin-edit-admin-without-permission.spec.ts` under `./scripts/nix/with-env`; `npx playwright install chromium` was required once in this environment for the browser cache path.

#### Files Modified

- apps/web/e2e/helpers/advancedFixtures.ts
- .llm/history/active/e2e-post-login-dashboard-helpers/e2e-post-login-dashboard-helpers-part-01.md
