# 11 - Podverse Boost Form Currency Input Formatting

## Scope
Phase 1 of strict currency-input work: define and implement the shared currency amount-input foundation (format metadata + parser/normalizer) used by all Metaboost-enabled Podverse boost forms.

## Problem Statement
- Amount input formatting currently risks USD-centric assumptions (`2` decimals, fixed symbols, generic numeric input behavior).
- Denomination behavior must vary by currency:
  - BTC (satoshis-only path): integer-only input (no decimal point).
  - USD and many fiats: major-unit display with decimal precision (commonly 2 decimals).
  - Zero-decimal currencies (for example JPY, KRW): integer-only major-unit input.
- Symbol prefix should reflect selected currency where available:
  - USD -> `$`
  - EUR -> `€`
  - GBP -> `£`
  - etc.
  - BTC/satoshis -> no symbol prefix.

## Decisions to Lock
1. Input UX follows currency denomination spec from Metaboost shared currency catalog (`minorUnitExponent`, canonical unit semantics), not ad hoc per-page constants.
2. Display precision is derived from denomination exponent:
   - exponent `0`: integers only (`step=1`, no decimal parsing path).
   - exponent `N>0`: allow up to `N` decimals and convert to minor units using deterministic rounding/validation policy.
3. Prefix symbol strategy:
   - First choice: derive via `Intl.NumberFormat(locale, { style: 'currency', currency })` token parsing.
   - Fallback: curated lookup map for unsupported/ambiguous runtime cases.
   - BTC/satoshis explicitly bypasses symbol prefix.
4. Parsing/normalization must remain loss-safe when converting typed major-unit strings to integer minor units used by API payloads.

## Steps
1. Inventory all Metaboost-enabled Podverse boost amount inputs and shared input/value helpers used by those forms.
2. Add or extend a shared currency-input formatter/parser utility in Podverse (or shared package used by Podverse) that:
   - resolves decimal precision from currency denomination metadata,
   - parses localized/normalized user input to minor units,
   - returns display metadata (`symbolPrefix`, placeholder hints, allowed step).
3. Lock utility contract consumed by downstream plans:
   - plan `12`: form integration across all surfaces,
   - plan `13`: validation UX and E2E matrix.
4. Ensure conversion-threshold logic from plan `06` can consume the same normalized integer minor amount to avoid drift between display and threshold checks.

## Key Files (Podverse repo)
- `apps/web/src/components/Boost/*` (shared input/value helpers)
- `packages/v4v-metaboost/src/*` (if helper extraction belongs in package layer)
- `apps/web/src/lib/**` shared parsing/format utilities (if chosen)

## Verification
- Utility outputs expected precision and symbol metadata for representative currencies (`USD`, `BTC`, `JPY`, `KRW`, `EUR`).
- Parser converts valid major-unit strings to integer minor units deterministically.
- Parser rejects invalid decimal precision for zero-decimal currencies and over-precision inputs.
- Contract is documented for plan `12` consumers so integration is deterministic.
