# 01 - SQL Query Inventory and Triage

## Scope

Create a complete inventory of SQL-relevant code paths in:

- `apps/api`
- `apps/management-api`
- `packages/orm`
- `packages/management-orm`

Classify each hit as:

- Likely safe (parameterized/bound).
- Needs review (dynamic identifiers/fragments).
- High risk (user-influenced SQL string construction).

## Steps

1. Run repo-wide pattern searches for raw SQL and dynamic query-builder fragments.
2. Build a table of all hits with:
   - file path
   - function/symbol
   - pattern detected
   - initial risk classification
3. Confirm if each hit is runtime code vs test/setup code.
4. Flag hotspots for deep validation in `02`.
5. Record "known safe patterns" to prevent false positives later.

## Required Search Patterns

- `.query(` usages with template literals and SQL strings.
- `createQueryBuilder` chained with template-literal `where`, `orderBy`, `groupBy`, `having`.
- SQL fragments containing `${...}`.
- string concatenation around SQL keywords.
- `Raw(...)` style query fragments.

## Key Files (Seed List)

- `packages/orm/src/services/BucketService.ts`
- `packages/orm/src/services/BucketMessageService.ts`
- `apps/management-api/src/controllers/usersController.ts`
- `packages/management-orm/src/services/ManagementEventService.ts`
- `packages/management-orm/src/services/ManagementUserService.ts`
- `apps/api/src/lib/recompute-threshold-snapshots.ts`
- `apps/management-api/src/lib/recompute-threshold-snapshots.ts`

## Output

- `SQL inventory report` (markdown): full hit list + triage labels.
- `Hotspot list for 02`: only the uncertain or risky entries.

## Verification

- Every SQL-related hit has exactly one classification.
- Hotspot list excludes obvious safe repository CRUD calls with no dynamic SQL.
- No app subtree above is omitted.
