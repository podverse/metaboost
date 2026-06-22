---
name: rate-limit-message
description: Standardizes 429 handling with RateLimitModal and retry-after UX. Use when handling API errors that may return 429 (rate limited) responses.
---

# Rate Limit Message Handling

## Instructions

- When an API call can return **429**, surface rate limiting with **`RateLimitModal`** from **`@metaboost/ui`** (or the same pattern: modal + **`retryAfterSeconds`** state).
- Parse **`Retry-After`** (seconds) from the response when present; pass **`retryAfterSeconds`** to **`RateLimitModal`** so the user sees how long to wait.
- Prefer the modal (or an inline error region) over **`alert()`** for user-facing rate-limit copy.
- Auth flows already follow this pattern in **`AuthContext`** and auth pages — reuse rather than inventing a one-off helper per page.

## Example (page state + modal)

```tsx
import { RateLimitModal } from '@metaboost/ui';

const [rateLimitRetrySeconds, setRateLimitRetrySeconds] = useState<number | undefined>(undefined);
const [rateLimitOpen, setRateLimitOpen] = useState(false);

// On 429 from API:
if (res.status === 429) {
  const retryAfter = parseRetryAfterSeconds(res.headers.get('Retry-After'));
  setRateLimitRetrySeconds(retryAfter);
  setRateLimitOpen(true);
}

<RateLimitModal
  open={rateLimitOpen}
  onClose={() => setRateLimitOpen(false)}
  retryAfterSeconds={rateLimitRetrySeconds}
/>
```

## Copy

- User-visible strings for **`RateLimitModal`** live in app i18n (`ui.rateLimitModal.*`) — the shared component uses **`next-intl`** keys, not hard-coded English in **`packages/ui`** call sites.

## Related

- **shared-ui-i18n** — localized modal copy in apps
- **i18n** skill — keep locales aligned when adding keys
