# 04 - Schema dedup + Postgres/web-push error helpers

## Scope

Three small DRY consolidations that remove duplication and remove `as` type
assertions flagged by the always-applied `avoid-type-assertions` rule.

## Steps

### 1. OpenAPI: extract `WebPushSubscriptionKeys`

In [apps/api/src/openapi.ts](/apps/api/src/openapi.ts), both
`UpsertWebPushSubscriptionBody` and `UpdateWebPushSubscriptionBody` inline an
identical `keys` object schema (`p256dh`, `auth`).

- Add a shared component:

  ```ts
  WebPushSubscriptionKeys: {
    type: 'object',
    required: ['p256dh', 'auth'],
    properties: {
      p256dh: { type: 'string', minLength: 1 },
      auth: { type: 'string', minLength: 1 },
    },
  }
  ```

- Reference it from both bodies via
  `keys: { $ref: '#/components/schemas/WebPushSubscriptionKeys' }`.

### 2. Joi: extract `webPushKeysObject`

In
[apps/api/src/schemas/webPushSubscriptions.ts](/apps/api/src/schemas/webPushSubscriptions.ts):

- Extract:

  ```ts
  const webPushKeysObject = Joi.object({
    p256dh: webPushKey.required(),
    auth: webPushKey.required(),
  });
  ```

- Use it in both schemas:

  ```ts
  upsertWebPushSubscriptionSchema = Joi.object({
    endpoint: ...,
    keys: webPushKeysObject.required(),
    locale: ...,
  });

  updateWebPushSubscriptionSchema = Joi.object({
    endpoint: ...,
    keys: webPushKeysObject.optional(),
    locale: ...,
  }).min(1);
  ```

### 3. Postgres unique-violation helper

The same shape appears in two new code paths:

- [apps/api/src/controllers/bucketsController.ts](/apps/api/src/controllers/bucketsController.ts)
  `isUniqueViolation`.
- Inline check inside `BucketService.create` in
  [packages/orm/src/services/BucketService.ts](/packages/orm/src/services/BucketService.ts).

Both currently use `(error as { code: string }).code === '23505'`. Centralize:

- Add to `@metaboost/orm` (e.g. `packages/orm/src/lib/pgError.ts`):

  ```ts
  export function getPgErrorCode(err: unknown): string | undefined {
    if (err === null || typeof err !== 'object' || !('code' in err)) {
      return undefined;
    }
    const code = (err as { code: unknown }).code;
    return typeof code === 'string' ? code : undefined;
  }

  export function isPgUniqueViolation(err: unknown): boolean {
    return getPgErrorCode(err) === '23505';
  }
  ```

- Confine the single `as` to the helper, with a short comment documenting why.
- Export from `packages/orm/src/index.ts`.
- Replace both inline guards with `isPgUniqueViolation(err)`.

### 4. Web-push status-code helper

The 8-line discriminator in
[apps/api/src/lib/notifications/webPushChannel.ts](/apps/api/src/lib/notifications/webPushChannel.ts)
that pulls `statusCode` off web-push errors should be its own helper next to the
channel:

```ts
function getWebPushErrorStatusCode(err: unknown): number | undefined {
  if (err === null || typeof err !== 'object' || !('statusCode' in err)) {
    return undefined;
  }
  const status = (err as { statusCode: unknown }).statusCode;
  return typeof status === 'number' ? status : undefined;
}
```

Use it in the cleanup branch in `Promise.allSettled` results (Phase 2).

## Key files

- `apps/api/src/openapi.ts`
- `apps/api/src/schemas/webPushSubscriptions.ts`
- `packages/orm/src/lib/pgError.ts` (new)
- `packages/orm/src/index.ts`
- `apps/api/src/controllers/bucketsController.ts`
- `packages/orm/src/services/BucketService.ts`
- `apps/api/src/lib/notifications/webPushChannel.ts`

## Tests

- Unit (Vitest in `packages/orm`): `isPgUniqueViolation` covers
  `null`/`undefined`/non-object/`{ code: '23505' }`/`{ code: '23503' }`/
  `{ code: 23505 }` (number).
- Existing webpush E2E and integration tests already exercise the unique-violation
  branch in `BucketService.create` (RSS channel duplicate guid).

## Verification

```bash
npm run test:e2e:api
```
