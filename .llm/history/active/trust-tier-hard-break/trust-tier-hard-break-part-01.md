### Session 1 - 2026-05-04

#### Prompt (Developer)

Coordinated Hard-Break Plan (Podverse + Metaboost)

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Hard-broke Metaboost app schema by dropping `trust_tier_id` from `user_trust_settings`.
- Removed `trustTierId` from ORM services/entities, management API schemas/controllers, and management-web form contracts.
- Kept membership tier + expiry behavior as the sole runtime eligibility axis.
- Removed obsolete trust-tier helper exports/constants now that runtime contracts no longer accept trust tiers.

#### Files Modified

- `.llm/history/active/trust-tier-hard-break/trust-tier-hard-break-part-01.md`
- `infra/k8s/base/ops/source/database/linear-migrations/app/0005_remove_user_trust_tier.sql`
- `infra/k8s/base/ops/kustomization.yaml`
- `infra/k8s/base/api/source/api.env`
- `packages/helpers-requests/src/types/management-user-types.ts`
- `apps/management-api/src/schemas/users.ts`
- `apps/management-api/src/controllers/usersController.ts`
- `apps/management-web/src/components/users/UserForm.tsx`
- `apps/management-web/src/app/(main)/user/[id]/edit/page.tsx`
- `packages/orm/src/entities/UserTrustSettings.ts`
- `packages/orm/src/services/UserService.ts`
- `packages/helpers/src/trust/constants.ts`
- `packages/helpers/src/index.ts`

### Session 2 - 2026-05-04

#### Prompt (Developer)

do it

#### Key Decisions

- Regenerate linear baseline `.sql.gz` snapshots after adding app linear migration `0005_remove_user_trust_tier.sql`.
- Baseline generator succeeded, but verification shows nondeterministic app baseline output due seeded terms UUID churn.

#### Files Modified

- `.llm/history/active/trust-tier-hard-break/trust-tier-hard-break-part-01.md`
- `infra/k8s/base/db/source/bootstrap/0003a_app_linear_baseline.sql.gz`
