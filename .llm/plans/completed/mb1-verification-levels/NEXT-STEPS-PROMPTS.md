# Next Steps Prompts

Use these prompts to execute the remaining `mb1-verification-levels` work in order.

## Prompt 1 - Web UI completion

```text
Implement plan file `.llm/plans/active/mb1-verification-levels/04-METABOOST-WEB-STATUS-ICONS-FILTERS-EXPAND.md`.
Focus specifically on:
- 4-state message indicators (fully-verified, verified-largest-recipient-succeeded, partially-verified, not-verified)
- per-message expand/collapse details panel showing recipient outcome payload
- replacing/expanding current filter controls to support includePartiallyVerified and includeUnverified
- preserving URL state contracts (defaults omitted from URL, page reset on filter change)

Do not edit other plan files.
```

## Prompt 2 - Management alignment

```text
Implement plan file `.llm/plans/active/mb1-verification-levels/05-METABOOST-MANAGEMENT-API-WEB-ALIGNMENT.md`.
Focus specifically on:
- management-web UI parity for verification badges/icons and expanded recipient details
- management-web filter controls aligned with threshold semantics
- keeping management-api and management-web response/query contracts consistent

Do not edit other plan files.
```

## Prompt 3 - Podverse wiring

```text
Implement plan file `.llm/plans/active/mb1-verification-levels/06-PODVERSE-INTEGRATION-AND-SIGNALING.md`.
Focus specifically on:
- wiring actual Podverse confirm-payment call paths to send recipient_outcomes (not just helper creation)
- deterministic status mapping for retries/batch outcomes
- ensuring payload only includes allowed value-recipient fields expected by Metaboost MB1

Do not edit other plan files.
```

## Prompt 4 - Verification and rollout

```text
Implement plan file `.llm/plans/active/mb1-verification-levels/07-TESTS-AND-ROLLBACK.md`.
Focus specifically on:
- API integration coverage for recipient_outcomes validation and level derivation permutations
- web/management-web E2E for new icons + expand details + includePartiallyVerified/includeUnverified filtering
- Podverse-side tests for final outbound confirm payload shape
- final rollout/rollback checklist updates

Do not edit other plan files.
```

## Prompt 5 - Completion decision

```text
Review `.llm/plans/active/mb1-verification-levels/` against implemented changes.
If all plan files are complete, move the plan set to `.llm/plans/completed/mb1-verification-levels/` and provide a completion summary.
If not complete, list exact remaining items by plan file.
```
