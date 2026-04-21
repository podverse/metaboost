# 02 - SQL Dataflow Verification

## Scope

Deep-verify every `needs review` and `high risk` SQL item from `01` by tracing user-controlled input from HTTP boundary to query execution.

## Steps

1. For each hotspot, trace dataflow:
   - route/controller input
   - schema validation/sanitization
   - service layer transformations
   - final query call
2. Verify guardrails for:
   - order/sort field allowlists
   - direction allowlists (`ASC`/`DESC`)
   - group/date bucket enum controls
   - search wildcard escaping where applicable
3. Confirm parameter binding for every user-provided value.
4. Identify any places where identifiers or SQL keywords are dynamic and not strictly mapped.
5. Produce exploitability judgment:
   - not exploitable (with reason)
   - potentially exploitable (with preconditions)
   - clearly exploitable

## High-Value Targets

- Dynamic `orderBy` usage in `packages/orm/src/services/BucketService.ts`.
- `date_trunc('${timeBucket}', ...)` and alias interpolation in `packages/orm/src/services/BucketMessageService.ts`.
- `conditions.join(' OR ')` query assembly in `apps/management-api/src/controllers/usersController.ts`.
- Any `.query()` with `$n` placeholders where query text might still be partially dynamic.

## Output

- `SQL deep-validation report` with:
  - traced dataflow per hotspot
  - exploitability decision
  - confidence level
  - remediation recommendation (if needed)

## Verification

- Every hotspot from `01` is resolved.
- Each resolution includes path-level evidence and input origin.
- Remediation recommendations are specific and minimal (no broad refactors unless justified).
