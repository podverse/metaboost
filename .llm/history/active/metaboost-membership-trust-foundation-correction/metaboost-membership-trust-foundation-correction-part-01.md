### Session 1 - 2026-05-04

#### Prompt (Developer)

Metaboost Membership + Trust Foundation Correction

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Correct Metaboost foundation from feature-specific entitlement fields to membership lifecycle plus trust metadata only.
- Keep runtime auth/controller/API behavior unchanged in this phase.
- Add a forward-only `0005` reconcile migration so environments that already applied an over-scoped `0004` can converge safely.

#### Files Created/Modified

- .llm/history/active/metaboost-membership-trust-foundation-correction/metaboost-membership-trust-foundation-correction-part-01.md

### Session 4 - 2026-05-04

#### Prompt (Developer)

do it

#### Key Decisions

- Extend Metaboost from schema-only to active runtime handling by enforcing membership validity in API auth middleware.
- Add management API/web support to view and edit `membershipTier`, `membershipExpiresAt`, `autoRenew`, and `trustTierId`.
- Ensure user lifecycle defaults apply on create and on tier transitions (free_trial/untrusted defaults, paid_premium/trusted defaults).

#### Files Modified

- apps/api/src/middleware/requireAuth.ts
- apps/management-api/src/controllers/usersController.ts
- apps/management-api/src/schemas/users.ts
- apps/management-web/src/components/users/UserForm.tsx
- apps/management-web/src/app/(main)/user/[id]/edit/page.tsx
- apps/management-web/i18n/originals/en-US.json
- apps/management-web/i18n/originals/es.json
- packages/helpers-requests/src/types/management-user-types.ts
- packages/orm/src/services/UserService.ts
- packages/orm/src/types/UserWithRelations.ts
- packages/orm/src/entities/UserTrustSettings.ts
- .llm/history/active/metaboost-membership-trust-foundation-correction/metaboost-membership-trust-foundation-correction-part-01.md

### Session 5 - 2026-05-04

#### Prompt (Developer)

For the code present, we get this error:
```
Property 'trustSettings' does not exist on type 'UserWithRelations'.
```
Fix it, verify, and then give a concise explanation. @metaboost/apps/api/src/middleware/requireAuth.ts:56-59

#### Key Decisions

- Replace direct `user.trustSettings` property access with a safe runtime extractor so `requireAuth` no longer depends on a specific `UserWithRelations` compile-time shape during package type-resolution drift.

#### Files Modified

- apps/api/src/middleware/requireAuth.ts
- .llm/history/active/metaboost-membership-trust-foundation-correction/metaboost-membership-trust-foundation-correction-part-01.md

### Session 6 - 2026-05-04

#### Prompt (Developer)

@metaboost/apps/management-web/src/app/(main)/user/[id]/edit/page.tsx:26-32 this seems like a helper that belongs in a shared package somewhere

#### Key Decisions

- Move `toDateTimeLocalValue` into `@metaboost/helpers` as shared date-time formatting utility and consume it from management-web instead of duplicating a local helper.

#### Files Modified

- packages/helpers/src/time/toDateTimeLocalValue.ts
- packages/helpers/src/index.ts
- apps/management-web/src/app/(main)/user/[id]/edit/page.tsx
- .llm/history/active/metaboost-membership-trust-foundation-correction/metaboost-membership-trust-foundation-correction-part-01.md

### Session 7 - 2026-05-04

#### Prompt (Developer)

Trial/Premium Terminology Revision Plan

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Hard-break membership tier vocabulary to `trial`/`premium` in schema and contracts, while preserving compatibility aliases in helper enums.
- Keep management API/web behavior aligned with trust defaults and status helper messaging.
- Update management user detail copy so Trial displays explicitly and Premium displays as Membership with Trial limitations guidance.
- Regenerate baseline gzip artifacts; note verify script still reports the known non-deterministic `terms_version` UUID mismatch in app baseline.

#### Files Modified

- packages/helpers/src/trust/constants.ts
- packages/helpers-requests/src/types/management-user-types.ts
- packages/orm/src/entities/UserTrustSettings.ts
- packages/orm/src/services/UserService.ts
- apps/management-api/src/controllers/usersController.ts
- infra/k8s/base/ops/source/database/linear-migrations/app/0004_user_trust_and_entitlement_overrides.sql
- apps/management-web/src/components/users/UserForm.tsx
- apps/management-web/src/app/(main)/user/[id]/edit/page.tsx
- apps/management-web/src/app/(main)/user/[id]/page.tsx
- apps/management-web/i18n/originals/en-US.json
- apps/management-web/i18n/originals/es.json
- infra/k8s/base/db/source/bootstrap/0003a_app_linear_baseline.sql.gz
- infra/k8s/base/db/source/bootstrap/0003b_management_linear_baseline.sql.gz
- .llm/history/active/metaboost-membership-trust-foundation-correction/metaboost-membership-trust-foundation-correction-part-01.md

### Session 3 - 2026-05-04

#### Prompt (Developer)

i think we can avoid using the 0005 file and instead create the user_trust_settings table correctly on the first pass

#### Key Decisions

- Remove reconcile migration `0005` and keep the trust/membership table creation as first-pass-only in `0004`.
- Re-align ops migration wiring and API expected migration marker to `0004`.
- Regenerate committed linear baseline gzip artifacts after migration chain update.

#### Files Modified

- infra/k8s/base/ops/source/database/linear-migrations/app/0005_user_trust_settings_membership_reconcile.sql
- infra/k8s/base/ops/kustomization.yaml
- infra/k8s/base/api/source/api.env
- infra/k8s/base/db/source/bootstrap/0003a_app_linear_baseline.sql.gz
- .llm/history/active/metaboost-membership-trust-foundation-correction/metaboost-membership-trust-foundation-correction-part-01.md
- infra/k8s/base/ops/source/database/linear-migrations/app/0004_user_trust_and_entitlement_overrides.sql
- infra/k8s/base/ops/source/database/linear-migrations/app/0005_user_trust_settings_membership_reconcile.sql
- infra/k8s/base/ops/kustomization.yaml
- infra/k8s/base/api/source/api.env
- packages/orm/src/entities/UserTrustSettings.ts
- packages/helpers/src/trust/constants.ts
- packages/helpers/src/index.ts

### Session 2 - 2026-05-04

#### Prompt (Developer)

do any gz files need to be regenerated for metaboost? if yes, regenerate them. also, if you need a skill to remind you to regenerated gz files when sql files change, then add them

#### Key Decisions

- Baseline gzip artifacts needed regeneration after app linear migration updates.
- Regenerated baseline archives via `scripts/database/generate-linear-baseline.sh`.
- Added a dedicated Cursor skill to enforce baseline gzip regeneration whenever linear SQL changes.
- Kept the generator/verifier workflow unchanged even though `verify-linear-baseline.sh` currently reports a deterministic mismatch caused by seeded `terms_version` UUID differences across runs.

#### Files Modified

- infra/k8s/base/db/source/bootstrap/0003a_app_linear_baseline.sql.gz
- .cursor/skills/linear-baseline-gz-sync/SKILL.md
- .llm/history/active/metaboost-membership-trust-foundation-correction/metaboost-membership-trust-foundation-correction-part-01.md
