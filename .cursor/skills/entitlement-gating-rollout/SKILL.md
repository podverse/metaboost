---
name: entitlement-gating-rollout
description: Roll out trust/entitlement behavior after schema foundations. Use when introducing capability checks, resolver logic, and deny contracts.
---

# Entitlement Gating Rollout

Use this skill for the post-foundation runtime phase.

## Rollout order

1. Add centralized entitlement resolver logic.
2. Add trust-tier default policy (env/config driven).
3. Apply per-user override precedence.
4. Introduce capability checks in auth/controller boundaries.
5. Map deny outcomes to stable API payload contracts.

## API deny contract

- Include machine-readable `code`.
- Include stable `i18nKey`.
- Include action path (for example renew/upgrade) when applicable.

## Coverage checklist

- All protected write/update actions use capability checks.
- Stats/notifications behavior follows entitlement policy.
- Management/admin edit surfaces can control overrides.
- Web and management-web map denial payloads consistently.

## Testing expectations

- Integration tests for allow/deny and override precedence.
- E2E tests for blocked UX and admin override effects.
