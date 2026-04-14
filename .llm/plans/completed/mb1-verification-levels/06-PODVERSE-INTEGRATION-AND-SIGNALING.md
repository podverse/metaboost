# 06 - Podverse Integration and Signaling

## Scope

Update Podverse V4V payment signaling so MB1 confirm-payment receives recipient-level outcomes.

## Key files (to locate and confirm during implementation)

- `/Users/mitcheldowney/repos/pv/podverse/packages/v4v-metaboost/` (send/confirm request assembly)
- `/Users/mitcheldowney/repos/pv/podverse/apps/*` call sites that dispatch boosts/streams
- `/Users/mitcheldowney/repos/pv/podverse/packages/helpers*` shared DTO/request helpers, if used
- `/Users/mitcheldowney/repos/pv/podverse/docs/v4v/` contract docs that mention MB1 confirm behavior

## Steps

1. Find current confirm-payment request builder in Podverse.
2. Extend payload generation to include recipient outcomes from split payment execution.
3. Ensure payload includes enough split data for largest-recipient determination.
4. Add robust mapping for mixed batch outcomes:
   - all succeeded
   - largest succeeded with some failures
   - largest failed with some successes
   - all failed / unknown
5. Ensure retry/idempotent flow does not corrupt recipient status reporting.
6. Update any Podverse-side types and docs for the new contract.
7. Add guards for older MB1 endpoints if mixed deployment is possible.

## Cross-repo dependency

- Depends on Metaboost API contract freeze from `01` and implementation from `03`.
- Podverse payload field names must match the OpenAPI contract exactly.

## Verification

- Integration or unit tests confirm request payload shape for all outcome permutations.
- End-to-end manual check confirms Metaboost stores expected level from Podverse payloads.
