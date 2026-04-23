---
name: e2e-authz-matrix
description: Adds authorization matrix coverage to Playwright specs. Use when testing pages with role or ownership rules so tests assert visible, hidden, disabled, and forbidden action states.
version: 1.0.0
---

# E2E AuthZ Matrix

Use this skill for permission-sensitive routes and controls. Current E2E bar: **Confident** (see e2e-crud-state-matrix).

For **permission-gated edit/detail/settings specs**, apply the full **permission actor matrix** process so all actor × outcome permutations are tested (unauthenticated, owner, non-owner with/without permission, non-admin, plus list→edit and Cancel→list). See the **e2e-permission-actor-matrix** skill for the step-by-step process and the reference implementation: web bucket-admin-edit is implemented across the `bucket-admin-edit-*.spec.ts` specs in `apps/web/e2e/` (unauthenticated, bucket-owner, bucket-admin, admin-without-permission, non-admin).

## Required role/ownership matrix

For each protected surface, include at least:

- Unauthenticated user
- Fully privileged user
- Restricted user or restricted row/entity condition (owner/self/superadmin cases)

## Required assertions

- Redirect or forbidden behavior for unauthenticated requests.
- Action visibility differences (`visible` vs `not rendered`) by role.
- Action interactivity differences (`enabled` vs `disabled`) by role/row state.
- Forbidden mutation attempts return stable UI feedback (error banner/toast/message) when applicable.

## Management-web specifics

- Prefer row-level assertions in resource tables for `view/edit/delete` action gating.
- Include superadmin/self-protection behavior when relevant.

## User context in the E2E report

For authZ tests, set the user context so the E2E HTML report shows which role/CRUD permissions are in effect. Call `setE2EUserContext(testInfo, '…')` at the start of each test (see e2e-readability skill). The report will display "User context: <description>" in the test section and summary.

## Completion checklist

- [ ] At least one non-happy-path authZ assertion exists for each permission-sensitive flow touched.
- [ ] Visibility and disabled-state checks are both present where UI supports both.
- [ ] No authZ scenario is marked complete with only route-load assertions.
