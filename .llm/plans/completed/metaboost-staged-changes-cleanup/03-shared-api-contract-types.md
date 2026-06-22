# 03 - Shared API contract types in one place

## Scope

`AGENTS.md` says "Shared request/response types may live in `packages/helpers-requests`
or `packages/helpers`." Today the new webpush + notification-preference types are
declared once in the API and again in `helpers-requests`, with no compile-time
guarantee they stay in sync. This phase makes `helpers-requests` the canonical
home and has the API import from there.

## Duplicated declarations to consolidate

- `UpsertWebPushSubscriptionBody` and `UpdateWebPushSubscriptionBody`
  - Defined in
    [apps/api/src/schemas/webPushSubscriptions.ts](/apps/api/src/schemas/webPushSubscriptions.ts).
  - Re-declared in
    [packages/helpers-requests/src/web/auth.ts](/packages/helpers-requests/src/web/auth.ts).
- `BucketNotificationPreferenceResponse` and `UpdateBucketNotificationPreferenceBody`
  - Defined in
    [apps/api/src/schemas/buckets.ts](/apps/api/src/schemas/buckets.ts).
  - Re-declared in
    [packages/helpers-requests/src/web/buckets.ts](/packages/helpers-requests/src/web/buckets.ts).
- `WebPushSubscriptionDto` already lives in `helpers-requests` but the API's
  `subscriptionToJson` builds a matching object without using the type.

## Steps

1. **Designate `helpers-requests` as canonical** for these four types. The
   existing declarations in `web/auth.ts` and `web/buckets.ts` stay; tighten
   them as needed (e.g. ensure `keys` is shared).

2. **Have the API schemas import the canonical TS types.**
   - In `apps/api/src/schemas/webPushSubscriptions.ts`, replace the local
     `export type Upsert.../Update...Body` blocks with
     `import type { UpsertWebPushSubscriptionBody, UpdateWebPushSubscriptionBody }
     from '@metaboost/helpers-requests';` + `export type { ... };`.
   - Same in `apps/api/src/schemas/buckets.ts` for the notification-preference
     types.

3. **Type the controller responses.**
   - In
     [apps/api/src/controllers/webPushSubscriptionsController.ts](/apps/api/src/controllers/webPushSubscriptionsController.ts),
     annotate
     `subscriptionToJson(row: UserWebPushSubscription): WebPushSubscriptionDto`
     so the handler cannot drift from the client type.
   - Annotate `getBucketNotificationPreference` / `updateBucketNotificationPreference`
     responses with the canonical types via explicit `Response<...>` type or
     a typed factory.

4. **Verify there are no other re-declarations.**
   - `rg "type BucketNotificationPreferenceResponse"` should return one hit.
   - `rg "type UpsertWebPushSubscriptionBody"` should return one hit (in
     `helpers-requests`) plus the schema file's `export type { ... }`.

## Key files

- `packages/helpers-requests/src/web/auth.ts`
- `packages/helpers-requests/src/web/buckets.ts`
- `apps/api/src/schemas/webPushSubscriptions.ts`
- `apps/api/src/schemas/buckets.ts`
- `apps/api/src/controllers/webPushSubscriptionsController.ts`
- `apps/api/src/controllers/bucketsController.ts`

## Tests

No behavior change. Existing API integration tests in
`apps/api/src/test/notification-webpush.test.ts` cover the response shape and
will catch any accidental drift.

## Verification

```bash
npm run test:e2e:api
```
