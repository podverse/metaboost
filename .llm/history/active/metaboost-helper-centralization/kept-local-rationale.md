# Kept Local Rationale

This note records generic-looking helpers that were intentionally kept local during the helper-centralization pass to avoid over-abstraction.

## Kept local (intentional)

- `toPublicStandardMessages` in `apps/api/src/controllers/mbV1Controller.ts` and `apps/api/src/controllers/mbrssV1Controller.ts`
  - Similar naming, but response payload shaping differs (`mbrss` includes breadcrumb logic and RSS-specific context), so a shared helper would add branching without reducing complexity.
- `parseMinimumAmountUsdCents` in API controllers
  - Already wraps endpoint-specific query behavior (`minimumAmountUsdCents`) and is coupled to current controller semantics.
- Bucket summary cookie parsing helpers in `apps/web` (`bucketSummaryPrefs.ts`, `BucketSummaryPanel.tsx`)
  - Similar to UI cookie helpers, but tied to this page flow and its specific cookie-map entry structure.
- RSS sync `normalizePath` in `apps/api/src/lib/rss-sync.ts`
  - Name overlaps with UI navigation normalization, but purpose differs (URL path handling in RSS sync flow vs client navigation path comparison).

## Centralization principle used

Helpers were centralized only when they were both:

1. Generic across domains, and
2. Duplicated (or likely to duplicate) across multiple files/packages.

Single-use helpers that encode endpoint/page-specific behavior were kept local.
