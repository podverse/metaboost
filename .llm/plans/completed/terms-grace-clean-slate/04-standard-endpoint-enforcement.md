# Phase 4 - Standard Endpoint Enforcement

## Scope

Apply terms policy to bucket message receive validity for mbrss-v1 and mb-v1.

## Steps

1. Reuse shared terms policy evaluator from Phase 2 for owner-level checks.
2. Keep `terms_of_service_url` as the authority for terms content in effect for the bucket.
3. Update GET capability check behavior:
   - if bucket is blocked due to missing required terms acceptance, return explicit error message.
   - do not add owner acceptance/effective-date fields to successful capability payloads.
   - standardize response contract:
     - HTTP `403`
     - error code `owner_terms_not_accepted_current`
     - deterministic human-readable blocker message.
4. Update POST ingest logic:
   - when owner acceptance is required and missing, reject with deterministic code and explicit
     error message.
   - use same status/code/message family as GET blocker for client consistency.
5. Keep ordering with existing sender/app block checks deterministic and documented.
6. Ensure both controllers stay behaviorally aligned:
   - mbrss-v1
   - mb-v1

## Key Files

- `/Users/mitcheldowney/repos/pv/metaboost/apps/api/src/controllers/mbrssV1Controller.ts`
- `/Users/mitcheldowney/repos/pv/metaboost/apps/api/src/controllers/mbV1Controller.ts`
- `/Users/mitcheldowney/repos/pv/metaboost/apps/api/src/lib/terms-policy/` (new/reused)

## Verification

- Integration tests cover:
  - GET capability error when blocked for terms acceptance
  - enforced phase POST rejected for non-accepted owner
  - accepted owner in enforced phase: ingest allowed.
