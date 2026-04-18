# 03 - Web E2E custom endpoint and children

## Scope

Add E2E coverage for Custom bucket creation and mb-specific detail/child flows in `apps/web`.

## Key files

- `apps/web/e2e/` (new or updated specs)
- `apps/web/src/app/(main)/buckets/BucketForm.tsx` (read-only reference)
- `apps/web/src/app/(main)/bucket/[id]/page.tsx` (read-only reference)
- `apps/web/src/app/(main)/bucket/[id]/EndpointPanel.tsx` (read-only reference)
- `apps/web/src/app/(main)/buckets/MbChildForm.tsx` (read-only reference)

## Steps

1. Add/extend specs for top-level bucket creation:
   - select Custom option
   - create `mb-root`
   - confirm redirect and Endpoint tab presence
2. Add detail-tab assertions:
   - `mb-root` / `mb-mid` / `mb-leaf` show Endpoint tab
   - `rss-channel` continues showing Add to RSS tab
3. Add child-flow assertions:
   - add child from `mb-root` and `mb-mid`
   - assert `mb-leaf` cannot create further children
   - assert RSS bucket pages do not expose Custom-child UI
4. Keep spec titles and report readability aligned with repo E2E rules.

## Verification

- Run only the targeted new/updated E2E specs.
- Confirm pass in CI-like local invocation (make-based E2E entrypoints).
