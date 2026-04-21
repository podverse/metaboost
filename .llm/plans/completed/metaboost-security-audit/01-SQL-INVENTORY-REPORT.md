# Plan 01 Output - SQL Inventory and Triage Report

## Scope Audited

- `apps/api`
- `apps/management-api`
- `packages/orm`
- `packages/management-orm`

## Search Patterns Used

- `.query(` usage in TypeScript runtime/test files.
- `createQueryBuilder(` usage.
- Query-builder calls using template literals in `where`, `andWhere`, `orWhere`, `orderBy`, `groupBy`, `having`.
- Dynamic interpolation patterns (`${...}`) near SQL fragments.
- `LIKE` / `ILIKE` search patterns and escaping behavior.

## Classification Legend

- `likely safe`: parameterized query or fixed SQL fragment with no user-controlled SQL shape.
- `needs review`: dynamic SQL fragment/identifier where safety depends on allowlist/call-site control.
- `high risk`: likely user-controlled SQL text interpolation.

## Runtime Inventory (Primary Scope)

| File | SQL-Relevant Pattern | Runtime/Test/Setup | Classification | Notes |
| --- | --- | --- | --- | --- |
| `packages/orm/src/services/BucketService.ts` | `qb.orderBy(\`bucket.${orderBy}\`, orderDir)` | runtime | needs review | `orderBy` is allowlisted to `name`, `createdAt`, `isPublic`; still dynamic identifier interpolation and must remain strictly mapped. |
| `packages/orm/src/services/BucketService.ts` | Raw recursive CTE via `appDataSourceRead.query(..., [rootBucketId])` | runtime | likely safe | Uses `$1` parameter binding; static SQL text. |
| `packages/orm/src/services/BucketService.ts` | Raw `INSERT ... ON CONFLICT` bulk settings updates with `$1/$2` | runtime | likely safe | All variable values passed in parameter array; query text is static. |
| `packages/orm/src/services/BucketService.ts` | `LIKE` search with escaped `%`, `_`, `\` and bound param | runtime | likely safe | Correct wildcard escaping and bound parameter usage. |
| `packages/orm/src/services/BucketMessageService.ts` | `date_trunc('${timeBucket}', msg.created_at)` | runtime | needs review | Dynamic SQL fragment; type restricts `timeBucket` to `hour/day/month`, but enforcement depends on call path. |
| `packages/orm/src/services/BucketMessageService.ts` | `applyExcludeSenderGuids` interpolates alias name into SQL fragment | runtime | needs review | Alias is not bound parameter; currently passed from internal literals only (`appMeta`, `sumMeta`, `tsMeta`, `lmMeta`). |
| `packages/orm/src/services/BucketMessageService.ts` | Bound `IN (:...bucketIds)` / `IN (:...actions)` / threshold filters | runtime | likely safe | Uses query-builder binding for values. |
| `packages/orm/src/services/TermsVersionService.ts` | Query-builder `where` / `orderBy` with bound params | runtime | likely safe | No dynamic SQL text from request input. |
| `packages/orm/src/services/UserTermsAcceptanceService.ts` | Query-builder with bound params on user/version filters | runtime | likely safe | No dynamic identifiers or raw SQL. |
| `packages/orm/src/services/BucketBlockedAppService.ts` | `ILIKE :pattern ESCAPE '\'` with escaped input | runtime | likely safe | Proper wildcard escaping and parameter binding. |
| `packages/orm/src/services/BucketBlockedSenderService.ts` | `ILIKE :pattern ESCAPE '\'` with escaped input | runtime | likely safe | Proper wildcard escaping and parameter binding. |
| `packages/management-orm/src/services/ManagementEventService.ts` | `sortBy` branch with fixed SQL fragments + `ILIKE :searchPattern` | runtime | needs review | Sort field is allowlisted; `searchPattern` uses `%${searchTrim}%` without escaping wildcard chars (not classic SQLi, but query-shape expansion/perf risk). |
| `packages/management-orm/src/services/ManagementUserService.ts` | Sort field allowlist + `ILIKE :searchPattern` | runtime | needs review | No SQL injection observed; search wildcard chars are not escaped. |
| `apps/management-api/src/controllers/usersController.ts` | `qb.andWhere(\`(${conditions.join(' OR ')})\`, { search: ... })` | runtime | needs review | `conditions` entries are fixed literals, not user-provided; pattern remains safe only while literals stay closed set. |
| `apps/management-api/src/controllers/usersController.ts` | Sort field allowlist (`email`, `displayName`, `createdAt`) | runtime | likely safe | Sort branch maps to fixed column/property names. |
| `apps/management-api/src/controllers/usersController.ts` | Escaped wildcard search | runtime | likely safe | Escapes `%`, `_`, `\` then binds parameter. |
| `apps/management-api/src/controllers/termsVersionsController.ts` | Query-builder update statements with `:status` / `:id` | runtime | likely safe | Static SQL shape; bound values only. |
| `apps/api/src/lib/recompute-threshold-snapshots.ts` | Raw `SELECT` and `UPDATE` via `query(..., params)` | runtime | likely safe | Uses positional placeholders `$1/$2/$3`. |
| `apps/management-api/src/lib/recompute-threshold-snapshots.ts` | Raw `SELECT` and `UPDATE` via `query(..., params)` | runtime | likely safe | Same pattern as API file; parameterized. |

## Test and Setup Findings (Out of Primary Runtime Risk)

| File | SQL-Relevant Pattern | Runtime/Test/Setup | Classification | Notes |
| --- | --- | --- | --- | --- |
| `apps/api/src/test/auth.test.ts` | Query-builder update of terms status in tests | test | likely safe | Uses static status filters and bound params. |
| `apps/api/src/test/bucket-summary.test.ts` | Raw `UPDATE ... WHERE id = $2` | test | likely safe | Parameterized test-only data mutation. |
| `apps/management-api/src/test/management-terms-versions.test.ts` | Query-builder update in `beforeAll` | test | likely safe | Static, test-only. |
| `tools/generate-data/src/main/data-source.ts` | Raw `TRUNCATE TABLE ...` | setup/tooling | likely safe | Static local seeding utility; destructive but non-user-driven SQL text. |
| `tools/generate-data/src/management/data-source.ts` | Raw `TRUNCATE TABLE ...` | setup/tooling | likely safe | Static local seeding utility. |
| `tools/generate-data/src/management/seed.ts` | `manager.query('SET CONSTRAINTS ALL DEFERRED')` | setup/tooling | likely safe | Constant SQL string in controlled setup script. |
| `tools/generate-data/src/management/seed.ts` | Query-builder searches with namespaced prefixes | setup/tooling | likely safe | Parameters bound via query builder. |

## Excluded False Positives

- Supertest request query helpers (`request(...).query({...})`) in tests are HTTP querystring builders, not SQL execution.
- Non-SQL template strings elsewhere in the repo were excluded from triage.

## Triage Summary

- `high risk`: none identified in this pass.
- `needs review`: dynamic identifier/fragment usage in:
  - `packages/orm/src/services/BucketService.ts`
  - `packages/orm/src/services/BucketMessageService.ts`
  - `apps/management-api/src/controllers/usersController.ts`
  - `packages/management-orm/src/services/ManagementEventService.ts`
  - `packages/management-orm/src/services/ManagementUserService.ts`
- `likely safe`: all other cataloged SQL usages.

## Hand-off to Plan 02

Use `.llm/plans/active/metaboost-security-audit/01-SQL-HOTSPOTS-FOR-02.md` as the deep-validation hotspot list and dataflow checklist.
