# 02 - Notification dispatch performance

## Scope

Two real scaling problems landed in the bucket-webpush-foundation work:

- N+1 query in
  [apps/api/src/lib/notifications/webPushChannel.ts](/apps/api/src/lib/notifications/webPushChannel.ts)
  (one DB round-trip per enabled user) and serial `await webpush.sendNotification`
  inside the inner loop.
- Per-row descendant upsert loop in
  [apps/api/src/controllers/bucketsController.ts](/apps/api/src/controllers/bucketsController.ts)
  `updateBucketNotificationPreference` when `applyToDescendants === true`.

Both replace existing logic with patterns already used elsewhere in the repo, so
the changes are small but impactful at scale.

## Steps

1. **Add `UserWebPushSubscriptionService.listByUserIds(userIds: string[])`** in
   [packages/orm/src/services/UserWebPushSubscriptionService.ts](/packages/orm/src/services/UserWebPushSubscriptionService.ts).
   - Single `WHERE user_id IN (...)` query; returns the rows ordered by
     `(userId, createdAt ASC)` so callers can group deterministically.
   - Keep `listByUser(userId)` for the user-self CRUD path.

2. **Rewrite `webPushChannel.sendWebPushForNewBucketMessage`.**
   - One call to `listByUserIds(enabledUserIds)`.
   - Build the JSON payload once, then dispatch with `Promise.allSettled` over
     all subscriptions.
   - Iterate the settled results to delete subscriptions that returned 404 or
     410 (re-using the new helper from Phase 4 once available; until then keep
     the inline status-code discriminator with a TODO referencing Phase 4).
   - Bound parallelism only if a follow-up specifies it; for now `allSettled` is
     enough.

3. **Add `BucketNotificationPreferenceService.upsertManyForUser(userId, bucketIds, enabled)`**
   in [packages/orm/src/services/BucketNotificationPreferenceService.ts](/packages/orm/src/services/BucketNotificationPreferenceService.ts).
   - Single SQL like:

     ```sql
     INSERT INTO bucket_notification_preference
       (user_id, bucket_id, enabled, created_at, updated_at)
     SELECT $1::uuid, id, $2::boolean, NOW(), NOW()
       FROM bucket
      WHERE id = ANY($3::uuid[])
     ON CONFLICT (user_id, bucket_id)
        DO UPDATE SET enabled = EXCLUDED.enabled, updated_at = NOW();
     ```
   - Mirrors the pattern already used by
     `BucketService.applyGeneralSettingsToDescendants` so style + safety match.

4. **Use the bulk service in the controller.**
   - Replace the `for (const childId of descendantIds) await upsert(...)` loop
     in `updateBucketNotificationPreference` with a single `upsertManyForUser`
     call when `descendantIds.length > 0`.

5. **Tests.**
   - Extend
     [apps/api/src/test/notification-webpush.test.ts](/apps/api/src/test/notification-webpush.test.ts)
     with:
     - `applyToDescendants` over a tree with at least 5 descendants asserts all
       descendant rows are written and that only one DB round-trip per call is
       made (spy on the service or use a query log if available).
     - Multi-subscriber dispatch case: two users with notifications enabled,
       each with multiple subscriptions; assert `webpush.sendNotification` is
       called the expected total count and that `listByUserIds` is invoked
       exactly once.

## Key files

- `packages/orm/src/services/UserWebPushSubscriptionService.ts`
- `packages/orm/src/services/BucketNotificationPreferenceService.ts`
- `apps/api/src/lib/notifications/webPushChannel.ts`
- `apps/api/src/controllers/bucketsController.ts`
- `apps/api/src/test/notification-webpush.test.ts`

## Verification

```bash
npm run test:e2e:api
```

Plus the existing webpush E2E spec to confirm UI behavior is unchanged:

```bash
make e2e_test_web_report_spec SPEC=e2e/bucket-notifications-webpush-bucket-owner.spec.ts
```
