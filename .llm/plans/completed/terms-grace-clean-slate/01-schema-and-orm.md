# Phase 1 - Schema and ORM

## Scope

Introduce DB-native terms versioning and versioned user acceptance records.

## Steps

1. Update canonical app schema in
   `/Users/mitcheldowney/repos/pv/metaboost/infra/k8s/base/db/postgres-init/0003_app_schema.sql`.
2. Add `terms_version` table:
   - `id` UUID PK
   - `version_key` (unique)
   - `title`
   - `content_hash`
   - `announcement_starts_at` (nullable)
   - `effective_at`
   - `enforcement_starts_at`
   - `status` (`draft`, `scheduled`, `active`, `retired`)
   - timestamps
3. Replace/extend `user_terms_acceptance` to versioned shape:
   - `id` UUID PK (or keep composite PK and still add version fk)
   - `user_id` FK -> `user`
   - `terms_version_id` FK -> `terms_version`
   - `accepted_at`
   - optional metadata: `acceptance_source`
   - unique (`user_id`, `terms_version_id`)
4. Add migration/backfill path from current acceptance table shape:
   - preserve existing acceptance timestamps
   - create an initial `terms_version` row representing currently in-effect terms
   - map existing accepted users to that initial version
   - include rollback notes for failed deploys before API code switch.
5. Add SQL constraints:
   - `enforcement_starts_at >= effective_at`
   - `announcement_starts_at <= enforcement_starts_at` when set
   - one `active` row at a time (partial unique index on status = active), if desired.
6. Implement ORM entities:
   - `TermsVersion`
   - updated `UserTermsAcceptance`
7. Implement ORM services:
   - fetch current active/scheduled version
   - record acceptance for user + current version (idempotent)
   - load user acceptance by version
8. Wire entities into:
   - `packages/orm/src/data-source.ts`
   - `packages/orm/src/index.ts`
   - any relation type files that currently model user terms acceptance.

## Key Files

- `/Users/mitcheldowney/repos/pv/metaboost/infra/k8s/base/db/postgres-init/0003_app_schema.sql`
- `/Users/mitcheldowney/repos/pv/metaboost/packages/orm/src/entities`
- `/Users/mitcheldowney/repos/pv/metaboost/packages/orm/src/services`
- `/Users/mitcheldowney/repos/pv/metaboost/packages/orm/src/data-source.ts`
- `/Users/mitcheldowney/repos/pv/metaboost/packages/orm/src/index.ts`

## Verification

- Ensure schema SQL is syntactically valid and relation FK targets exist.
- Ensure ORM build/typecheck passes.
- Add integration tests in Phase 5 validating:
  - creation and lookup of active terms version
  - idempotent acceptance writes
  - acceptance history across multiple versions.
  - migration/backfill correctness for pre-existing acceptance rows.
