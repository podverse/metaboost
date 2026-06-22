# 06 - Style + import hygiene + logger alignment

## Scope

Final polish pass. Three small adjustments aligned with already-applied repo
rules and skills.

## Steps

### 1. Replace inline styles in bucket detail `bucketName`

[apps/web/src/app/(main)/bucket/[id]/page.tsx](/apps/web/src/app/(main)/bucket/[id]/page.tsx)
renders the bucket name inside a `span` with two `style={{ display: 'inline-flex',
... }}` blocks (outer flex row + inner public/lock icon span). Per
`styles-source-of-truth` and `avoid-wrapper-elements`, use SCSS classes:

- Add a co-located SCSS module (e.g. `BucketName.module.scss`) with classes for
  the row and icon spans, using `@metaboost/ui` design tokens.
- If the same name + visibility pattern shows up in any other bucket page,
  extract a small `BucketNameWithVisibility` component instead and import it.
- Verify the four error-page files (now in `@metaboost/ui` after Phase 1)
  carry no inline styles. This is a checkpoint, not new work, since Phase 1
  already required SCSS modules for those components.

### 2. Web-push named imports

[apps/api/src/lib/notifications/webPushChannel.ts](/apps/api/src/lib/notifications/webPushChannel.ts)
uses a default import:

```ts
import webpush from 'web-push';
```

Per `prefer-named-exports`:

```ts
import { setVapidDetails, sendNotification } from 'web-push';
```

The `web-push` package exports both as named symbols. Update call sites
accordingly. The mock in
[apps/api/src/test/notification-webpush.test.ts](/apps/api/src/test/notification-webpush.test.ts)
must be updated to use named exports too:

```ts
vi.mock('web-push', () => ({
  setVapidDetails: vi.fn(),
  sendNotification: vi.fn().mockResolvedValue(undefined),
}));
```

### 3. Replace `console.error` in webpush channel

The single `console.error('webPushChannel: sendNotification failed', ...)` call
is the only `console.*` use in the API runtime path for this feature. Switch to
the standard logger used by other Metaboost API controllers (check
`apps/api/src/lib/logger.ts` or the existing import pattern in nearby
controllers; mirror it). This aligns with the Podverse `logging` skill and is
consistent with the surrounding code style.

## Key files

- `apps/web/src/app/(main)/bucket/[id]/page.tsx`
- `apps/web/src/app/(main)/bucket/[id]/BucketName.module.scss` (new)
- `apps/api/src/lib/notifications/webPushChannel.ts`
- `apps/api/src/test/notification-webpush.test.ts`

## Tests

- No new tests required; the existing webpush integration test already exercises
  the error branch (one `expect(webpush.sendNotification).toHaveBeenCalled()`
  case). After updating the mock to named exports, all existing assertions must
  still pass.

## Verification

```bash
npm run test:e2e:api
make e2e_test_web_report_spec SPEC=e2e/bucket-notifications-webpush-bucket-owner.spec.ts
```
