# Phase 5 - OpenAPI, Tests, and Seeds

## Scope

Finalize contracts and validate all policy phases via deterministic test data.

## Steps

1. Update OpenAPI schemas:
   - auth user terms-policy payload shape
   - `PATCH /auth/terms-acceptance` request/response
   - standard GET capability error response for terms-blocked buckets:
     - status `403`
     - code `owner_terms_not_accepted_current`
     - explicit message field
   - standard POST ingest enforcement error docs with same status/code/message family.
2. API integration tests:
   - auth phase transitions (`announcement`, `grace`, `enforced`)
   - acceptance of current version
   - delete-me remains functional
   - standard endpoint GET/POST terms blocker error behavior.
3. Web E2E tests:
   - terms-required redirect only when `mustAcceptNow = true`
   - grace warning visible but user not hard-blocked
   - accept flow clears block
   - More Options delete flow still works.
4. Seed updates:
   - seed multiple `terms_version` rows with deterministic dates
   - mark one active current version
   - seed users with accepted-current, accepted-old, never-accepted states
   - include terms policy state needed by auth and standard tests.
5. Ensure docs and i18n are aligned with stable field names and error codes.
6. Ensure no owner terms state fields are required in successful capability responses.
7. Add tests for `LEGAL_NAME` terms sentence interpolation:
   - server/client renders in `/terms` and `/terms-required`
   - fallback behavior when env is empty/missing is deterministic.

## Key Files

- `/Users/mitcheldowney/repos/pv/metaboost/apps/api/src/openapi.ts`
- `/Users/mitcheldowney/repos/pv/metaboost/apps/api/src/openapi-mbrssV1.ts`
- `/Users/mitcheldowney/repos/pv/metaboost/apps/api/src/openapi-mbV1.ts`
- `/Users/mitcheldowney/repos/pv/metaboost/apps/api/src/test/auth.test.ts`
- `/Users/mitcheldowney/repos/pv/metaboost/apps/api/src/test/mbrss-v1-spec-contract.test.ts`
- `/Users/mitcheldowney/repos/pv/metaboost/apps/api/src/test/mb-v1-spec-contract.test.ts`
- `/Users/mitcheldowney/repos/pv/metaboost/apps/web/e2e/`
- `/Users/mitcheldowney/repos/pv/metaboost/tools/web/seed-e2e.mjs`

## Verification Commands (for user to run)

```bash
make E2E_API_GATE_MODE=on e2e_test_web_report_spec SPEC=e2e/terms-required-users.spec.ts
make E2E_API_GATE_MODE=on e2e_test_web_report_spec SPEC=e2e/terms-unauthenticated.spec.ts
```
