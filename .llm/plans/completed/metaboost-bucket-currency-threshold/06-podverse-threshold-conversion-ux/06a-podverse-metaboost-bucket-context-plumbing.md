# 06a - Podverse MetaBoost Bucket Context Plumbing

## Scope
Wire Podverse bucket context consumption so all target forms can read preferred currency, minimum threshold, and conversion endpoint URL from Metaboost bucket responses.

## Steps
1. Inventory all Podverse MetaBoost-enabled v4v form entry points and identify where bucket/public bucket data is currently fetched.
2. Ensure form-facing data contracts include:
   - `preferredCurrency`
   - `minimumMessageAmountMinor`
   - `conversionEndpointUrl`
3. Plumb these values through the view-model/props path used by:
   - donate page flow
   - podcast page boost flow
   - episode page boost flow
4. Remove any ad hoc fallback assumptions that ignore returned bucket context.
5. Keep behavior unchanged for non-MetaBoost flows.

## Key Files (Podverse repo)
- `apps/web/src/app/donate/page.tsx`
- `apps/web/src/app/podcast/[channel_id]/PodcastPageList.tsx`
- `apps/web/src/app/episode/[item_id]/EpisodePageList.tsx`
- `apps/web/src/components/Boost/*`
- `packages/v4v-metaboost/src/publicMessages.ts` (or related client helpers)

## Verification
- Target forms receive bucket preferred currency, minimum threshold, and conversion endpoint URL when Metaboost is enabled.
- No form path relies on hardcoded threshold currency assumptions.
