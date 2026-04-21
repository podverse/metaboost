# Phase 6 - Operations and LEGAL_NAME Env + i18n

## Scope

Close the remaining production-operability gaps and wire `LEGAL_NAME` end-to-end for translated
terms copy.

## Steps

1. Define operator workflow for terms lifecycle:
   - how to create a new `terms_version` (`draft` -> `scheduled` -> `active` -> `retired`)
   - who is allowed to activate/retire
   - how to ensure exactly one active version.
2. Define operational surface for lifecycle actions:
   - preferred: management/API endpoint with authz + audit logging
   - fallback: controlled SQL runbook with explicit review/approval steps.
3. Document emergency rollback:
   - revert active version selection
   - expected user-facing impact during rollback
   - validation checklist after rollback.
4. Add `LEGAL_NAME` as a canonical env variable in env-classification + override flow:
   - add to `infra/env/classification/base.yaml` in the `info` workload
   - map to web runtime as `NEXT_PUBLIC_LEGAL_NAME` (and equivalent management mapping only if
     needed there later)
   - ensure merge/env-classification sync helpers propagate overrides.
5. Update runtime-config pipeline for web:
   - include `NEXT_PUBLIC_LEGAL_NAME` in sidecar required keys + validation + payload
   - include the key in web runtime config type/store/env helpers.
6. Update docs for local overrides and env reference:
   - include `LEGAL_NAME` in `dev/env-overrides/local/info.env` guidance
   - note interaction with `NEXT_PUBLIC_LEGAL_NAME` sync.
7. Terms i18n first sentence contract:
   - translated key must interpolate `{legalName}` in sentence one only
   - if `legalName` is missing, use a safe fallback value from i18n (e.g. "the site owner") so
     sentence remains grammatical in each locale
   - all subsequent terms paragraphs remain generic and do not require interpolation.

## Key Files

- `/Users/mitcheldowney/repos/pv/metaboost/infra/env/classification/base.yaml`
- `/Users/mitcheldowney/repos/pv/metaboost/scripts/env-classification/lib/metaboost_env_merge.rb`
- `/Users/mitcheldowney/repos/pv/metaboost/scripts/local-env/setup.sh`
- `/Users/mitcheldowney/repos/pv/metaboost/apps/web/sidecar/src/server.ts`
- `/Users/mitcheldowney/repos/pv/metaboost/apps/web/src/config/runtime-config.ts`
- `/Users/mitcheldowney/repos/pv/metaboost/apps/web/src/config/runtime-config-store.ts`
- `/Users/mitcheldowney/repos/pv/metaboost/apps/web/src/config/env.ts`
- `/Users/mitcheldowney/repos/pv/metaboost/apps/web/i18n/originals/en-US.json`
- `/Users/mitcheldowney/repos/pv/metaboost/apps/web/i18n/originals/es.json`
- `/Users/mitcheldowney/repos/pv/metaboost/docs/development/ENV-REFERENCE.md`
- `/Users/mitcheldowney/repos/pv/metaboost/docs/development/LOCAL-ENV-OVERRIDES.md`

## Verification

- Env classification render includes `LEGAL_NAME` and synced `NEXT_PUBLIC_LEGAL_NAME`.
- Web sidecar startup validation passes with the new required key.
- `/terms` and `/terms-required` first sentence interpolates `LEGAL_NAME` correctly in all
  supported locales.
- Missing/empty `LEGAL_NAME` fallback behavior is deterministic and tested.
- Operator runbook/API steps are documented enough for on-call execution without tribal context.
