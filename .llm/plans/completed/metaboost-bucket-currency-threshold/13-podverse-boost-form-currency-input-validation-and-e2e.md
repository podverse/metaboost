# 13 - Podverse Boost Form Currency Input Validation and E2E

## Scope
Phase 3 of strict currency-input work: finalize validation UX, i18n copy, and E2E coverage for per-currency precision and symbol-prefix behavior.

## Preconditions
- Plan `12` integration is complete.

## Steps
1. Add/align validation messages for:
   - invalid decimal precision for selected currency,
   - unsupported/invalid currency formatting states,
   - deterministic guidance when user input cannot be normalized to minor units.
2. Update i18n keys in Podverse originals/overrides for currency-input precision guidance and symbol-related UX text.
3. Add/expand Podverse E2E scenarios that verify:
   - BTC/satoshis: no decimals accepted, no symbol prefix.
   - USD/EUR-like currencies: expected decimal precision and symbol prefix.
   - JPY/KRW-like currencies: integer-only behavior.
   - currency switching updates behavior without stale formatting.
4. Verify threshold-gating UX (plan `06`) remains consistent after formatting changes.

## Key Files (Podverse repo)
- `apps/web/i18n/originals/*.json`
- `apps/web/i18n/overrides/*.json`
- `apps/web/e2e/*.spec.ts`
- `apps/web/src/components/Boost/*`

## Verification
- E2E coverage exists for the currency precision/symbol matrix and passes locally when run by user.
- Validation and helper text are localized and deterministic.
- Threshold gating and conversion messaging remain correct after input-formatting hardening.
