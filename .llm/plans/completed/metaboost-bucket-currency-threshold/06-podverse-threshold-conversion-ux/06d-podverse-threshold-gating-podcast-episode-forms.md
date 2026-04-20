# 06d - Podverse Threshold Gating (Podcast + Episode Forms)

## Scope
Extend donate-form threshold gating behavior to all Metaboost-enabled podcast/episode v4v forms (`mb-v1` and `mbrss-v1`) with parity.

## Steps
1. Identify all podcast/episode boost form surfaces that submit through Metaboost paths.
2. Reuse the same threshold compare pipeline from `06c`:
   - normalized integer minor amount
   - explicit `amount_unit`
   - same-currency short-circuit
   - conversion helper for cross-currency
3. Apply same UX gating behavior:
   - disable `Name` and `Message` when below threshold
   - same exact threshold notice string
4. Ensure shared helpers/components are used where practical to avoid form-specific drift.
5. Confirm both `mb-v1` and `mbrss-v1` paths are covered.

## Key Files (Podverse repo)
- `apps/web/src/app/podcast/[channel_id]/PodcastPageList.tsx`
- `apps/web/src/app/episode/[item_id]/EpisodePageList.tsx`
- `apps/web/src/components/Boost/*`

## Verification
- Podcast + episode forms match donate form gating behavior.
- No form duplicates custom conversion math outside shared pipeline.
