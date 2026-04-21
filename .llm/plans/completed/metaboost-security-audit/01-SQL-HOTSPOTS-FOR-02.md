# Plan 01 Output - Hotspots for Plan 02

This file is the direct input for `02-sql-dataflow-verification.md`.

## Priority A - Dynamic SQL Shape

### 1) `packages/orm/src/services/BucketService.ts`

- Pattern:
  - `qb.orderBy(\`bucket.${orderBy}\`, orderDir)` in `findAccessibleByUser` and `listPaginated`.
- Why this is a hotspot:
  - SQL identifier is interpolated into SQL text.
  - Safety depends on strict allowlist (`LIST_PAGINATED_SORT_FIELDS`) and mapping discipline.
- Plan 02 checks:
  - Confirm all `orderBy` values are derived from explicit allowlist only.
  - Confirm no code path passes unvetted user input directly to `sortBy`.
  - Confirm no future enum drift (for example snake_case column names or arbitrary property names).

### 2) `packages/orm/src/services/BucketMessageService.ts`

- Pattern:
  - `const bucketExpression = \`date_trunc('${timeBucket}', msg.created_at)\`;`
  - SQL alias interpolation in `applyExcludeSenderGuids` using `${appMetaAlias}`.
- Why this is a hotspot:
  - SQL fragment contains interpolated value for function argument.
  - Alias interpolation is safe only when aliases are internal constants.
- Plan 02 checks:
  - Trace all callers of `summarizeTimeSeriesByBucketIds` to ensure `timeBucket` cannot come from unchecked request input.
  - Verify alias argument callsites are limited to trusted literals (`appMeta`, `sumMeta`, `tsMeta`, `lmMeta`).
  - Decide if hardening should use explicit mapping rather than interpolation.

### 3) `apps/management-api/src/controllers/usersController.ts`

- Pattern:
  - `qb.andWhere(\`(${conditions.join(' OR ')})\`, { search: ... })`.
- Why this is a hotspot:
  - SQL condition string is built dynamically (though currently from fixed literals).
- Plan 02 checks:
  - Validate that `conditions` can only contain predefined strings and never raw user values.
  - Trace `filterColumns` parsing/validation to ensure out-of-set values do not alter SQL text.

## Priority B - Search Pattern Behavior (Abuse/Perf, Not Classic SQLi)

### 4) `packages/management-orm/src/services/ManagementEventService.ts`

- Pattern:
  - `ILIKE :searchPattern` with `%${searchTrim}%` and no explicit wildcard escaping.
- Plan 02 checks:
  - Confirm this is acceptable behavior or classify as abuse/performance hardening item.
  - Verify no SQL injection path exists (parameter remains bound).

### 5) `packages/management-orm/src/services/ManagementUserService.ts`

- Pattern:
  - `ILIKE :searchPattern` with `%${searchTrim}%` and no explicit wildcard escaping.
- Plan 02 checks:
  - Same as above; confirm bound-parameter safety and document wildcard semantics.

## Priority C - Confirmed Parameterized Raw SQL (Quick Re-Validation)

### 6) `apps/api/src/lib/recompute-threshold-snapshots.ts`
### 7) `apps/management-api/src/lib/recompute-threshold-snapshots.ts`
### 8) `packages/orm/src/services/BucketService.ts` (raw query sections)

- Pattern:
  - Raw SQL with positional placeholders (`$1`, `$2`, `$3`) and parameter arrays.
- Plan 02 checks:
  - Verify SQL text stays static and no interpolated query text is introduced by wrappers/callers.
  - Confirm all user-originated values arrive as bound parameters only.

## Current Exploitability Snapshot (Pre-Plan 02)

- No clearly exploitable SQL injection found in this inventory pass.
- Primary remaining risk is future or hidden bypass of allowlists around dynamic SQL fragments.
- Plan 02 should convert this preliminary assessment into explicit dataflow-backed exploitability decisions.
