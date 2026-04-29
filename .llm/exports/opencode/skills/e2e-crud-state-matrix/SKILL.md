---
name: e2e-crud-state-matrix
description: Enforces a strict CRUD and UI-state matrix for Playwright tests in apps/web and apps/management-web. Use when adding or reviewing E2E specs for create/read/update/delete, validation, show/hide, enable/disable, and empty/loading/error branches.
version: 1.0.0
---


# E2E CRUD State Matrix

Use this skill before marking E2E work complete.

## Current E2E bar: Confident

The project targets **Confident** coverage: happy paths and auth boundaries covered; permission matrix on important surfaces (e.g. bucket admin edit, role edit, message edit); URL-state where it matters; deny tests use real seeded resources so breaking permission checks fails the test. Cells in the CRUD/state/auth matrices marked Gap are backlog—fix when touching that feature, not as a single "close all gaps" pass. Matrix checklists: [docs/testing/E2E-CRUD-STATE-AUTH-MATRICES.md](docs/testing/E2E-CRUD-STATE-AUTH-MATRICES.md) (index), [E2E-CRUD-STATE-AUTH-MATRIX-WEB.md](docs/testing/E2E-CRUD-STATE-AUTH-MATRIX-WEB.md), [E2E-CRUD-STATE-AUTH-MATRIX-MANAGEMENT-WEB.md](docs/testing/E2E-CRUD-STATE-AUTH-MATRIX-MANAGEMENT-WEB.md).

## Required matrix per surface

For each tested page/component surface, explicitly track:

- Create
- Read
- Update
- Delete
- Show/hide controls by state
- Enable/disable transitions (including submit loading state)
- Validation (required fields, invalid input, server error text)
- Empty/loading/error states

## Quality bar

- Prefer deterministic assertions over broad fallback assertions.
- Do not accept “route loads” as sufficient for edit/delete flows.
- For update/delete, assert both action result and post-action persistence.
- For forms, assert button/input state transitions before and after submit.

## Minimum assertion patterns

- **Create**: submit valid form -> redirect/result -> row/detail visible.
- **Update**: edit field -> save -> revisit list/detail -> updated value visible.
- **Delete**: confirm dialog path -> row removed; cancel path -> row unchanged.
- **Validation**: empty/invalid submit -> remains on form -> validation visible.
- **State branches**: explicit assertions for each reachable empty/loading/error branch.

## Permission-gated surfaces

For edit/detail/settings pages that are gated by ownership or role (bucket admin, bucket role, message edit, management resource edit), also apply the **e2e-permission-actor-matrix** skill so all actor × outcome permutations (unauthenticated, owner, non-owner with/without permission, non-admin) and flow tests (list→edit, Cancel→list) are covered.

## Completion checklist

- [ ] Every modified surface has CRUD row status (`covered` or `deferred`).
- [ ] Deferred rows include rationale in the active plan/history.
- [ ] For permission-gated surfaces, actor matrix coverage is applied (see e2e-permission-actor-matrix).
- [ ] Changed specs pass targeted runs.
- [ ] Full relevant app E2E run passes.
