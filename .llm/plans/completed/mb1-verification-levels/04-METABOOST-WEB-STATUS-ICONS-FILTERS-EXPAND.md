# 04 - Metaboost Web Status Icons, Filters, and Expand

## Scope

Update web message UI to show 4 verification states, hierarchical filters, and expandable detail.

## Key files

- `/Users/mitcheldowney/repos/pv/metaboost/apps/web/src/app/(main)/bucket/[id]/page.tsx`
- `/Users/mitcheldowney/repos/pv/metaboost/apps/web/src/app/(main)/bucket/[id]/MessagesHeaderControls.tsx`
- `/Users/mitcheldowney/repos/pv/metaboost/apps/web/src/lib/buckets.ts`
- `/Users/mitcheldowney/repos/pv/metaboost/packages/ui/src/components/bucket/MessageCard/MessageCard.tsx`
- `/Users/mitcheldowney/repos/pv/metaboost/packages/ui/src/components/bucket/BucketMessageList/BucketMessageList.tsx`

## UI status indicators

- `fully-verified` -> green checkmark.
- `verified-largest-recipient-succeeded` -> distinct positive-success indicator.
- `partially-verified` -> yellow warning triangle.
- `not-verified` -> red circle-x.

## Steps

1. Add verification state fields to web message view model.
2. Add a status row/badge in `MessageCard` for the 4-level indicator.
3. Add an expand/collapse section on each message card for full verification payload details.
4. Replace binary unverified filter control with threshold-based controls:
   - default threshold: `verified-largest-recipient-succeeded`
   - optional include `partially-verified`
   - optional include `not-verified`
5. Keep URL-state behavior deterministic:
   - include query params only when non-default
   - preserve pagination/sort with filter changes
6. Ensure non-admins do not see privileged widening controls.

## UX details to lock

- Human-readable label for each state in cards and detail sections.
- Copy for expanded section fields (recipient count, largest recipient status, failure reasons).
- Accessibility labels for status icons and expand toggles.

## Verification

- Existing bucket messages tab still loads with default threshold.
- Toggling include options widens list as expected.
- Expanded details reflect API payload accurately.
