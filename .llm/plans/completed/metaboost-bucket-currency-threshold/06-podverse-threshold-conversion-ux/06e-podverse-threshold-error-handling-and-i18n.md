# 06e - Podverse Threshold Error Handling and i18n

## Scope
Finalize deterministic error handling and i18n coverage for threshold conversion UX and lock dependencies for plans `11-13`.

## Steps
1. Define deterministic UI behavior for missing/invalid denomination metadata:
   - do not silently proceed
   - show stable user-facing message
   - keep disabled state behavior predictable
2. Align and add i18n keys for:
   - threshold notice text
   - conversion unavailable/invalid denomination states
   - helper guidance copy if conversion cannot be computed
3. Ensure all target locales used by Podverse include the new keys.
4. Add/align verification checklist that explicitly gates plans `11-13` on this plan’s completion.
5. Confirm UX consistency across donate, podcast, and episode flows.

## Key Files (Podverse repo)
- `apps/web/i18n/originals/*.json`
- `apps/web/i18n/overrides/*.json`
- `apps/web/src/components/Boost/*`
- `apps/web/src/app/donate/page.tsx`
- `apps/web/src/app/podcast/[channel_id]/PodcastPageList.tsx`
- `apps/web/src/app/episode/[item_id]/EpisodePageList.tsx`

## Verification
- Invalid/missing denomination metadata produces deterministic and localized UX.
- Threshold notice and error copy are consistent across all covered forms.
- Dependency note is explicit: plans `11`, `12`, and `13` start after `06e` completes.
