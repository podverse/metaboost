---
name: membership-expiry-ux-contract
description: Keep expiry-related API and UX behavior consistent. Use when implementing reduced-functionality states, blocked-action modals, and renewal/upgrade navigation.
---


# Expiry UX Contract

Use this skill whenever account expiry or eligibility loss affects user actions.

## API contract

- Return non-alarming expiry responses.
- Include `code` + `i18nKey` for deterministic UI mapping.
- Include action path when users can remediate.

## UI contract

- Persistent reminder banner for reduced functionality state.
- Blocked-action modal with:
  - dismiss
  - direct remediation action (renew/upgrade/contact)
- Shared mapping layer for denial code -> UI message/action.

## Content principles

- Be clear and actionable.
- Avoid alarming error language.
- Explain reduced behavior succinctly.

## Consistency checks

- All protected surfaces consume the same deny contract.
- i18n keys exist for surfaced copy.
- Modal and banner behavior do not conflict.
