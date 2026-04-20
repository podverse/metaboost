# 12 - Podverse Boost Form Currency Input Integration

## Scope
Phase 2 of strict currency-input work: integrate the shared formatter/parser utility from plan `11` into every Metaboost-enabled Podverse boost form surface.

## Preconditions
- Plan `06` (threshold/conversion gating) is complete.
- Plan `11` (shared currency input utility contract) is complete.

## Steps
1. Integrate the shared utility into all relevant amount inputs:
   - donate flow,
   - podcast page boosts,
   - episode page boosts,
   - any additional Metaboost-enabled `mb-v1`/`mbrss-v1` surfaces.
2. Ensure all form submission paths consume the normalized integer minor amount produced by the shared parser (no per-form duplicate parsing logic).
3. Wire symbol prefix rendering to the utility metadata:
   - fiat currencies show symbol when available,
   - BTC/satoshis path shows no symbol.
4. Wire precision behavior to the utility metadata:
   - exponent `0` currencies use integer-only behavior,
   - exponent `N>0` currencies enforce `N` decimal precision.
5. Keep threshold checks from plan `06` aligned with this same normalized amount pipeline.

## Key Files (Podverse repo)
- `apps/web/src/components/Boost/*`
- `apps/web/src/app/donate/page.tsx`
- `apps/web/src/app/podcast/[channel_id]/PodcastPageList.tsx`
- `apps/web/src/app/episode/[item_id]/EpisodePageList.tsx`
- `packages/v4v-metaboost/src/*`

## Verification
- Currency switch updates input precision and symbol behavior immediately on each form surface.
- Form payloads remain integer minor-unit values for all supported currencies.
- No form path retains legacy ad hoc decimal parsing logic.
