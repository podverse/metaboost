# 03 - Web UI and Service Worker (Metaboost Web)

## Scope

- Add bell toggle on bucket pages.
- Add apply-scope modal when bucket has sub-buckets.
- Implement browser Web Push lifecycle (permission, subscribe, unsubscribe, service worker).

## Steps

1. Add bell control in bucket page header action area.
   - Show enabled/disabled state for current user + current bucket.
2. On toggle, resolve whether bucket has sub-buckets.
   - If no children: apply directly.
   - If children: show modal with
     - apply to this bucket only
     - apply to all sub-buckets
3. Reuse existing scope-modal UX language/pattern from bucket settings flow.
4. Enable flow.
   - Request browser notification permission.
   - Register service worker.
   - Subscribe with PushManager using VAPID public key.
   - Persist subscription via API create/update endpoint.
5. Disable flow.
   - Unsubscribe push subscription.
   - Delete server-side subscription.
   - Update bucket preference state.
6. Service worker behavior.
   - Handle push events (foreground and background).
   - Handle notification click navigation into web app route.

## Key files

- apps/web/src/app/(main)/bucket/[id]/BucketDetailTabShell.tsx
- apps/web/src/app/(main)/bucket/[id]/BucketDetailTabsClient.tsx
- apps/web/src/app/(main)/buckets/BucketForm.tsx
- apps/web/src/lib/buckets.ts
- apps/web/public/webpush-sw.js (new)

## Exit criteria

- Bell toggle is available on web bucket pages.
- Scope modal appears only when sub-buckets exist.
- Subscribe/unsubscribe flow is functional end-to-end with API persistence.