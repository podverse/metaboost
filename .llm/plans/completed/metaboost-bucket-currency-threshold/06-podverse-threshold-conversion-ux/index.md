# 06 - Podverse Threshold Conversion UX (Split Index)

## Purpose
Split former `06-podverse-donate-threshold-and-conversion-ux.md` into smaller execution units while keeping all original constraints and coverage.

## Execution Order
1. `06a-podverse-metaboost-bucket-context-plumbing.md` (completed; moved to `.llm/plans/completed/metaboost-bucket-currency-threshold/06-podverse-threshold-conversion-ux/06a-podverse-metaboost-bucket-context-plumbing.md`)
2. `06b-podverse-conversion-request-plumbing.md` (completed; moved to `.llm/plans/completed/metaboost-bucket-currency-threshold/06-podverse-threshold-conversion-ux/06b-podverse-conversion-request-plumbing.md`)
3. `06c-podverse-threshold-gating-donate-form.md` (completed; moved to `.llm/plans/completed/metaboost-bucket-currency-threshold/06-podverse-threshold-conversion-ux/06c-podverse-threshold-gating-donate-form.md`)
4. `06d-podverse-threshold-gating-podcast-episode-forms.md` (completed; moved to `.llm/plans/completed/metaboost-bucket-currency-threshold/06-podverse-threshold-conversion-ux/06d-podverse-threshold-gating-podcast-episode-forms.md`)
5. `06e-podverse-threshold-error-handling-and-i18n.md` (completed; moved to `.llm/plans/completed/metaboost-bucket-currency-threshold/06-podverse-threshold-conversion-ux/06e-podverse-threshold-error-handling-and-i18n.md`)

## Global Constraints (apply to all 06x plans)
- Cover all Metaboost-enabled v4v boost forms (`mb-v1` and `mbrss-v1`), not donate-only.
- Do not guess denomination units in UI logic.
- Require explicit `amount_unit` metadata for conversion paths.
- Surface deterministic user-facing errors when denomination metadata is missing/invalid.
- Keep threshold comparison aligned with normalized integer minor-unit amount pipeline used by plans `11`, `12`, and `13`.

## Follow-on Dependency
- Plans `11`, `12`, and `13` start only after `06e` is complete.
