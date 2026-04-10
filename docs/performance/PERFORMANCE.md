# Performance review

Findings from the front-end and back-end performance review (plan 08). Prioritized by impact and effort; low-effort items that were implemented are noted.

## Bundle analysis

- **Web / management-web**: Use bundle analysis to inspect client and server chunks.
- **Web (webpack)**: From repo root, run:
  ```bash
  npm run build:analyze:web
  ```
  or `ANALYZE=true npm run build -w @boilerplate/web`. This uses `@next/bundle-analyzer`; reports open in the browser after the build.
- **Next.js 16+**: Alternatively, `npx next experimental-analyze` (from the app directory) for Turbopack-based analysis when using Turbopack.
- Run analysis after adding large dependencies or when optimizing bundle size; compare before/after.

## Front-end findings

| Finding                   | Location                                             | Suggested fix                                                                                                                | Effort              |
| ------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| No dynamic imports        | apps/web, apps/management-web                        | Use `next/dynamic` for heavy components (e.g. modals, admin-only sections, charts) to reduce initial JS.                     | Low–medium          |
| No React.lazy / dynamic() | App router pages, packages/ui                        | Lazy-load route-level or heavy UI components where it clearly reduces initial load.                                          | Low                 |
| Memoization               | List/detail pages (buckets, bucket detail, settings) | Add `React.memo` or `useMemo`/`useCallback` only where profiling shows unnecessary re-renders; avoid premature optimization. | Low (per component) |
| Static assets             | Next.js config                                       | Production builds already emit hashed `_next/static`; Next.js sets long cache by default. Dev uses `no-store` correctly.     | Done (defaults OK)  |
| Bundle analyzer           | apps/web                                             | Optional `ANALYZE=true` build script and `@next/bundle-analyzer` added so bundle analysis can be run on demand.              | Done (low)          |

## Back-end findings

| Finding                 | Location                                | Suggested fix                                                                                                                                                                                    | Effort                 |
| ----------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- |
| findAncestry N+1        | packages/orm BucketService.findAncestry | Loads each parent in a loop (one query per ancestor). Replace with a single query (e.g. recursive CTE or batch load by IDs).                                                                     | Medium                 |
| listBuckets parent load | apps/api bucketsController.listBuckets  | Parents are already batched via `Promise.all(parentIds.map(id => BucketService.findById(id)))`; one query per unique parent, not per bucket.                                                     | OK (no change)         |
| List payloads           | API list endpoints                      | List endpoints return DTOs (e.g. toBucketResponse); no full entity bloat observed. Pagination used where applicable (e.g. management-api).                                                       | OK                     |
| Indexes                 | infra/database                          | Indexes exist on `owner_id`, `parent_bucket_id`, `short_id`, `bucket_admin(bucket_id, user_id)`, `bucket_message(bucket_id, created_at)`, etc. Add indexes only if profiling shows slow queries. | Done (indexes present) |
| Caching                 | API responses                           | No HTTP cache headers or Redis for API responses yet. Consider Cache-Control for public/read-only endpoints or response caching for expensive reads if needed later.                             | Medium (when required) |

## Prioritized summary

- **Implemented (low effort):** Bundle analyzer wiring for web (`ANALYZE=true` build), this doc.
- **Backlog / tickets:** findAncestry N+1 fix (medium), dynamic imports for heavy components (low–medium), response caching if metrics justify it (medium).

## Verification

- After changes: run `npm run build` and (optionally) `ANALYZE=true npm run build -w @boilerplate/web` to confirm build and analysis still work.
- Run the test suite; no behavior change from performance documentation or analyzer wiring.
