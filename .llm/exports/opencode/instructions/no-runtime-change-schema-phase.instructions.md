---
description: "Converted from no-runtime-change-schema-phase.mdc"
---
# No Runtime Changes During Schema-Only Trust Phase

When implementing a **schema-only** trust/entitlement foundation:

## Required

- Add forward-only migrations, constraints, and backfill.
- Add ORM entities/relations and helper constants/types.
- Update migration bundle wiring and expected migration markers.

## Prohibited

- Do not modify auth middleware behavior for trust/capability gating.
- Do not add route/controller allow-deny checks.
- Do not expose trust settings in API responses.
- Do not change web/management-web blocked-action behavior.

## Intent

Schema-only phases prepare data-model infrastructure only. Runtime behavior belongs to a separate
implementation phase with dedicated integration/E2E coverage.
