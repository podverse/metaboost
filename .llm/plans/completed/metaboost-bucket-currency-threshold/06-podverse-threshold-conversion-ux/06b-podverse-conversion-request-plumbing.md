# 06b - Podverse Conversion Request Plumbing

## Scope
Add/align Podverse conversion request plumbing so threshold comparisons can convert cross-currency amounts using explicit denomination metadata.

## Steps
1. Add or align a single conversion request helper in Podverse MetaBoost client code.
2. Require helper inputs to include:
   - source currency
   - source integer minor amount
   - explicit `amount_unit`
   - conversion endpoint URL (from bucket context)
3. Enforce no-guess behavior:
   - if `amount_unit` is missing/invalid, return deterministic error state to caller.
4. Normalize helper response shape for threshold consumers:
   - target currency
   - target integer minor amount
   - rates freshness metadata (if available)
5. Keep helper usage isolated so later plans (`11-13`) can reuse the same normalized amount pathway.

## Key Files (Podverse repo)
- `packages/v4v-metaboost/src/publicMessages.ts` (or related request helpers)
- `apps/web/src/components/Boost/*` shared form/value helpers

## Verification
- Same-currency callers can skip conversion call cleanly.
- Cross-currency callers receive deterministic converted minor amount or deterministic error (no silent fallback).
