# Plan 02 Output - SQL Dataflow Verification Report

## Scope

Deep validation of hotspots from:

- `.llm/plans/active/metaboost-security-audit/01-SQL-HOTSPOTS-FOR-02.md`

Goal: trace HTTP/user input to SQL execution and produce exploitability decisions.

## Decision Legend

- `not exploitable`: no practical SQL injection path from user input to SQL text.
- `potentially exploitable`: not currently exploitable, but could become exploitable with plausible future drift.
- `clearly exploitable`: user-controlled SQL text path is present now.

## Hotspot Verifications

### A1) `BucketService` dynamic `orderBy` identifier interpolation

- **Hotspot**: `packages/orm/src/services/BucketService.ts`
  - `qb.orderBy(\`bucket.${orderBy}\`, orderDir)` in `findAccessibleByUser` and `listPaginated`.
- **Dataflow trace**
  - API input sources:
    - `apps/api/src/controllers/bucketsController.ts` -> `req.query.sortBy` / `req.query.sortOrder` -> `BucketService.findAccessibleByUser(...)`
    - `apps/management-api/src/controllers/bucketsController.ts` -> `req.query.sortBy` / `req.query.sortOrder` -> `BucketService.listPaginated(...)`
  - Guardrail in service (independent of controller):
    - `orderBy` is accepted only if in `LIST_PAGINATED_SORT_FIELDS = ['name', 'createdAt', 'isPublic']`; otherwise fallback to `'name'`.
    - `orderDir` is constrained to `'ASC'` / `'DESC'`.
- **Exploitability decision**: `not exploitable` (current code), **high confidence**.
- **Reasoning**
  - User input cannot inject arbitrary identifier/fragment because the service allowlist enforces a closed set before interpolation.
- **Hardening recommendation (optional)**
  - Replace string interpolation with explicit branch mapping for all sort fields for defense-in-depth and easier auditing.

### A2) `BucketMessageService` dynamic `date_trunc('${timeBucket}', ...)`

- **Hotspot**: `packages/orm/src/services/BucketMessageService.ts`
  - `const bucketExpression = \`date_trunc('${timeBucket}', msg.created_at)\`;`
- **Dataflow trace**
  - Method signature requires `timeBucket: 'hour' | 'day' | 'month'`.
  - Repo-wide usage search found only the method definition; no runtime call sites currently invoke this method.
- **Exploitability decision**: `not exploitable` (current runtime reachability), **medium-high confidence**.
- **Reasoning**
  - No active call path from HTTP input to this SQL fragment exists right now.
  - If future call paths pass unvalidated strings, this pattern could become injection-prone.
- **Hardening recommendation**
  - Convert to fixed mapping:
    - `hour -> date_trunc('hour', ...)`, `day -> ...`, `month -> ...`
  - Keep `isSummaryTimeBucket()` gate at boundary where user input is first parsed.

### A3) `BucketMessageService` alias interpolation in `applyExcludeSenderGuids`

- **Hotspot**: `packages/orm/src/services/BucketMessageService.ts`
  - `(${appMetaAlias}.sender_id IS NULL OR ... NOT IN (:...excludeSenderGuids))`
- **Dataflow trace**
  - `applyExcludeSenderGuids` is `private static`; external modules cannot call it directly.
  - All internal call sites pass hardcoded alias literals only (`appMeta`, `sumMeta`, `tsMeta`, `lmMeta`).
  - `excludeSenderGuids` values are bound query params (`:...excludeSenderGuids`), not interpolated SQL text.
- **Exploitability decision**: `not exploitable`, **high confidence**.
- **Reasoning**
  - No user-controlled alias reaches SQL text.

### A4) `usersController` dynamic `conditions.join(' OR ')`

- **Hotspot**: `apps/management-api/src/controllers/usersController.ts`
  - `qb.andWhere(\`(${conditions.join(' OR ')})\`, { search: ... })`
- **Dataflow trace**
  - `filterColumns` comes from `req.query.filterColumns`.
  - Parsed values are filtered to allowlist `['email', 'displayName']`.
  - `conditions` array is populated only with two fixed literals:
    - `LOWER(credentials.email) LIKE LOWER(:search) ESCAPE '\'`
    - `LOWER(bio.display_name) LIKE LOWER(:search) ESCAPE '\'`
  - Search value is wildcard-escaped (`%`, `_`, `\`) and then bound parameterized as `:search`.
- **Exploitability decision**: `not exploitable`, **high confidence**.
- **Reasoning**
  - User input influences branch selection and parameter values only, not SQL text content.

### B1) `ManagementEventService` search pattern (`ILIKE :searchPattern`)

- **Hotspot**: `packages/management-orm/src/services/ManagementEventService.ts`
- **Dataflow trace**
  - `apps/management-api/src/controllers/eventsController.ts` forwards `req.query.search` to service.
  - Service constructs `%${searchTrim}%` and binds via `:searchPattern`.
  - `sortBy` is allowlisted (`timestamp`, `actor`, `action`, `target`, `details`) and mapped to fixed SQL fragments.
- **Exploitability decision**: `not exploitable` for SQLi, **high confidence**.
- **Residual risk**
  - Wildcard characters are not escaped, allowing very broad pattern scans (performance/abuse risk, not SQL injection).

### B2) `ManagementUserService` search pattern (`ILIKE :searchPattern`)

- **Hotspot**: `packages/management-orm/src/services/ManagementUserService.ts`
- **Dataflow trace**
  - `apps/management-api/src/controllers/adminsController.ts` forwards `req.query.search`, `sortBy`, `sortOrder`.
  - Service allowlists sort fields (`username`, `displayName`, `createdAt`) and maps to fixed columns/properties.
  - Search pattern is bound parameter `:searchPattern` with `%${searchTrim}%`.
- **Exploitability decision**: `not exploitable` for SQLi, **high confidence**.
- **Residual risk**
  - Same wildcard broad-match/performance behavior as above.

### C1) Parameterized raw SQL validation

- **Files**
  - `apps/api/src/lib/recompute-threshold-snapshots.ts`
  - `apps/management-api/src/lib/recompute-threshold-snapshots.ts`
  - Raw query sections in `packages/orm/src/services/BucketService.ts`
- **Dataflow trace**
  - Dynamic values originate from validated/typed app state (bucket IDs, threshold values, currency).
  - All values are passed via positional parameters (`$1`, `$2`, `$3`) with param arrays.
  - SQL text is static in current code.
- **Exploitability decision**: `not exploitable`, **high confidence**.

## Overall Exploitability Outcome

- `clearly exploitable`: **none found**.
- `potentially exploitable` (future drift risk only):
  - `BucketMessageService.summarizeTimeSeriesByBucketIds` dynamic `date_trunc` fragment if future call sites bypass enum validation.
- `not exploitable` (current code): all audited hotspots.

## Prioritized Remediation/Hardening Candidates (Non-blocking)

1. Convert interpolated SQL fragments to explicit mapping branches where practical:
   - `BucketService` dynamic `orderBy`
   - `BucketMessageService` `date_trunc` expression
2. Optionally escape wildcard metacharacters in management search endpoints to reduce expensive broad scans.
3. Add regression guardrail checks (lint/review checklist) to prevent introducing template-string SQL with user input.

## Plan 02 Completion Checklist

- [x] Every hotspot from plan 01 resolved with dataflow evidence.
- [x] Each resolution includes exploitability decision and confidence.
- [x] No remediation code changes applied in this step.
