# 05 - Helpers + bell refactor + single-query upsert

## Scope

The largest cleanup phase. Five independent steps; ship them in one PR or split
if review surface is too large. Each step removes a localized duplication or
inefficiency. No behavior change.

## Steps

### 1. `requireUser` auth-check helper

Today, every newly added handler in
[apps/api/src/controllers/webPushSubscriptionsController.ts](/apps/api/src/controllers/webPushSubscriptionsController.ts)
opens with the same 4-line `req.user === undefined` guard (4 occurrences in one
new file; 6 across the touched controllers). The runtime check is dead code in
practice because every handler is mounted behind `requireAuthMiddleware`.

- Add a helper in `apps/api/src/middleware/auth.ts` (or co-located near
  `asyncHandler`) that returns the user or sends 401 and returns `null`:

  ```ts
  export function requireUser(req: Request, res: Response): User | null {
    if (req.user === undefined) {
      res.status(401).json({ message: 'Authentication required' });
      return null;
    }
    return req.user;
  }
  ```

- Replace the four occurrences in `webPushSubscriptionsController.ts` and the
  newly-touched handlers in `bucketsController.ts` (`listBuckets`,
  `createBucket`).
- Drop the unreachable `subscriptionId` validation in `update`/`delete`
  handlers (Express has matched the route param). If a typed param is needed,
  move it to a single `validateParams` middleware later.

### 2. `cookieHeaderToHeaders` helper in `helpers-requests`

[packages/helpers-requests/src/web/buckets.ts](/packages/helpers-requests/src/web/buckets.ts)
contains the same conditional 11 times:

```ts
...(cookieHeader !== undefined && cookieHeader !== ''
  ? { headers: { Cookie: cookieHeader } }
  : {}),
```

- Add to [packages/helpers-requests/src/request.ts](/packages/helpers-requests/src/request.ts):

  ```ts
  export function cookieHeaderToHeaders(
    cookieHeader: string | undefined
  ): { headers: { Cookie: string } } | object {
    return cookieHeader !== undefined && cookieHeader !== ''
      ? { headers: { Cookie: cookieHeader } }
      : {};
  }
  ```

- Replace all 11 sites in `web/buckets.ts`. Limit scope to that file in this PR
  (other helpers can adopt the helper in a follow-up sweep).

### 3. `withServerCookie` helper in `apps/web/src/lib`

The new `fetchBucketNotificationPreference` follows the same shape as
`fetchBucket`, `fetchChildBuckets`, `fetchMessages`, etc. in
[apps/web/src/lib/buckets.ts](/apps/web/src/lib/buckets.ts):

```ts
const cookieHeader = await getCookieHeader();
const baseUrl = getServerApiBaseUrl();
const res = await webBuckets.reqXxx(baseUrl, ..., cookieHeader);
if (!res.ok || res.data === undefined) return defaultValue;
return res.data;
```

- Add to [apps/web/src/lib/server-request.ts](/apps/web/src/lib/server-request.ts):

  ```ts
  export async function withServerCookie<T>(
    call: (baseUrl: string, cookieHeader: string) => Promise<ApiResponse<T>>
  ): Promise<{ ok: boolean; data: T | undefined }> {
    const cookieHeader = await getCookieHeader();
    const baseUrl = getServerApiBaseUrl();
    const res = await call(baseUrl, cookieHeader);
    return { ok: res.ok, data: res.data };
  }
  ```

- Refactor the `fetch*` helpers in `lib/buckets.ts` to use `withServerCookie`.
  Leave the per-helper default-value handling in the caller; the helper just
  removes the cookie/baseUrl preamble.

### 4. Single-query upserts in two new ORM services

Both new services do a `repo.upsert` followed by `repo.findOne` (two queries):

- [packages/orm/src/services/UserWebPushSubscriptionService.ts](/packages/orm/src/services/UserWebPushSubscriptionService.ts)
  `upsert`.
- [packages/orm/src/services/BucketNotificationPreferenceService.ts](/packages/orm/src/services/BucketNotificationPreferenceService.ts)
  `upsert`.

Replace each with raw SQL (use `appDataSourceReadWrite.query`) of the form
`INSERT ... ON CONFLICT (...) DO UPDATE SET ... RETURNING *` and parse the row.
Drop the post-upsert `findOne`. Trade-off: bypasses TypeORM repository hooks,
but neither entity declares any. Document this with a one-line comment.

### 5. Split `BucketNotificationsBell`

[apps/web/src/app/(main)/bucket/[id]/BucketNotificationsBell.tsx](/apps/web/src/app/(main)/bucket/[id]/BucketNotificationsBell.tsx)
is 227 lines mixing browser-side push subscription, server preference patching,
scope modal state, error display, and visual chrome. Split:

- `apps/web/src/app/(main)/bucket/[id]/useBucketWebPushSubscription.ts`:
  hook returning `{ enabled, loading, errorMessage, enable, disable }`. Owns
  Notification permission, PushManager subscribe/unsubscribe, server upsert,
  `reqPatchBucketNotificationPreference`. Generic over scope.
- `apps/web/src/components/useApplyToDescendantsModal.tsx`: hook + modal that
  returns `{ openFor, open, dismiss, confirm }` for any future preference toggle
  with an "apply to descendants" decision. Lives in `apps/web/src/components`
  because future toggles may use it outside the bucket detail page.
- `BucketNotificationsBell.tsx`: presentational only - composes the two hooks,
  renders the bell button, tooltip, and error text.

## Key files

- `apps/api/src/middleware/auth.ts` (or new helper file)
- `apps/api/src/controllers/webPushSubscriptionsController.ts`
- `apps/api/src/controllers/bucketsController.ts`
- `packages/helpers-requests/src/request.ts`
- `packages/helpers-requests/src/web/buckets.ts`
- `apps/web/src/lib/server-request.ts`
- `apps/web/src/lib/buckets.ts`
- `packages/orm/src/services/UserWebPushSubscriptionService.ts`
- `packages/orm/src/services/BucketNotificationPreferenceService.ts`
- `apps/web/src/app/(main)/bucket/[id]/BucketNotificationsBell.tsx`
- `apps/web/src/app/(main)/bucket/[id]/useBucketWebPushSubscription.ts` (new)
- `apps/web/src/components/useApplyToDescendantsModal.tsx` (new)

## Tests

- Unit (Vitest in `apps/api`): `requireUser` returns user when set; sends 401
  + returns `null` when not.
- Unit (Vitest in `packages/helpers-requests`): `cookieHeaderToHeaders` for
  `undefined`, `''`, `'k=v'`.
- Existing webpush E2E spec covers the bell behavior end to end; if the split
  changes any aria labels or button structure, update the spec accordingly.
- API integration: existing `notification-webpush.test.ts` exercises the
  upsert path; assert returned row has the expected `id` after the rewrite.

## Verification

```bash
npm run test:unit
npm run test:e2e:api
make e2e_test_web_report_spec SPEC=e2e/bucket-notifications-webpush-bucket-owner.spec.ts
```
