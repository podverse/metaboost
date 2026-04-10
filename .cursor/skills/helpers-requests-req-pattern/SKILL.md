---
name: helpers-requests-req-pattern
description: Use @boilerplate/helpers-requests and the "req..." function pattern for all API calls from apps. Use when adding or changing HTTP requests to the API, or when you see raw fetch() or axios in app code.
---

# Helpers-requests and the req... pattern

All outbound API requests from apps (web, management-web) must go through **@boilerplate/helpers-requests**, using the **req...** function pattern. Do not use raw `fetch()` or direct HTTP clients in app code for API calls.

## Rules

1. **No raw fetch for API calls**  
   App code must not call `fetch(url, ...)` for app/management API endpoints. Use a `req...` helper from `@boilerplate/helpers-requests` instead.

2. **Req... naming**
   - **GET**: `reqFetch...` (e.g. `reqFetchBucket`, `reqFetchPublicBucket`, `reqFetchPublicBucketMessages`).
   - **POST**: `reqPost...` (e.g. `reqPostPublicBucketMessage`).
   - Other verbs: `reqPatch...`, `reqPut...`, `reqDelete...` as needed.

3. **Where helpers live**
   - **Web app API**: `packages/helpers-requests/src/web/` (e.g. `web/buckets.ts`, `web/auth.ts`). Exported as `webBuckets`, `webAuth`, etc.
   - **Management-web API**: `packages/helpers-requests/src/management-web/`. Exported as `managementWebAuth`, `managementWebAdmins`, etc.
   - Each helper calls the shared `request()` from `packages/helpers-requests/src/request.js` (consistent URL building, JSON, error shape, optional auth/locale).

4. **Adding a new endpoint**
   - Add a `req...` function in the appropriate module under `web/` or `management-web/`.
   - Use `request<T>(baseUrl, path, options)` with `method`, `body`, `headers`, `credentials` as needed.
   - Export the function via the existing namespace (e.g. `webBuckets`) in `packages/helpers-requests/src/index.ts`.
   - In the app, call e.g. `webBuckets.reqPostPublicBucketMessage(baseUrl, bucketId, body)` and handle `res.ok` / `res.error.message`.

5. **Base URL**
   - Server-side: use `getServerApiBaseUrl()` (from app lib); base URL already includes API version path.
   - Client-side: use `getApiBaseUrl()` from app’s api-client (or equivalent); it includes version path.

## Example (client component)

```ts
import { webBuckets } from '@boilerplate/helpers-requests';
import { getApiBaseUrl } from '../../../../../lib/api-client';

const baseUrl = getApiBaseUrl();
const res = await webBuckets.reqPostPublicBucketMessage(baseUrl, bucketId, {
  senderName,
  body,
  isPublic,
});
if (!res.ok) {
  setSubmitError(res.error.message ?? 'Failed to submit');
  return;
}
// res.data available when res.ok
```

## Example (server component)

```ts
import { webBuckets } from '@boilerplate/helpers-requests';
import { getServerApiBaseUrl } from '../../../../../lib/server-request';

const baseUrl = getServerApiBaseUrl();
const res = await webBuckets.reqFetchPublicBucket(baseUrl, id);
if (!res.ok || res.data?.bucket === undefined) return null;
return res.data.bucket;
```

## When to use this skill

- Adding or changing any HTTP request from apps/web or apps/management-web to the main API or management API.
- Reviewing or refactoring code that uses `fetch(...)` or direct HTTP calls to app backends.
- Adding a new API endpoint and wiring it in the frontend: add the `req...` helper first, then use it in the app.
