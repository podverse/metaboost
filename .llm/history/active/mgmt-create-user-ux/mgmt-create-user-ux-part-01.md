# mgmt-create-user-ux (Metaboost)

**Started:** 2026-05-04
**Context:** Metaboost management-web create-user UX (plan handoff + completion).

## Session 1 - 2026-05-04

#### Prompt (Developer)

Management web create-user UX (Podverse + Metaboost)

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Added `NEXT_PUBLIC_FREE_TRIAL_EXPIRATION` to management-web runtime config and sidecar optional keys; validated with `validatePositiveNumber` (min 0, optional).
- Introduced `createUserFormDefaults.ts` using `addMonths` from `@metaboost/helpers` for premium defaults aligned with ORM.
- `UserForm`: styled `Select` for tier; cadence `Select` when Premium (create); persisted expiry + cadence in `localStorage`; `premiumBillingCadence` on create API body; invitation-focused copy.
- `FormActions.module.scss`: `justify-content: flex-end`.
- Extended **use-form-component** skill with FormActions footer alignment notes.

#### Files Created/Modified

- `apps/management-web/src/config/runtime-config.ts`
- `apps/management-web/src/config/runtime-config-store.ts`
- `apps/management-web/src/lib/createUserFormDefaults.ts`
- `apps/management-web/src/components/users/UserForm.tsx`
- `apps/management-web/sidecar/src/server.ts`
- `apps/management-web/sidecar/.env.example`
- `apps/management-web/i18n/originals/en-US.json`
- `infra/k8s/base/management-web/source/management-web-sidecar.env`
- `packages/ui/src/components/form/FormActions/FormActions.module.scss`
- `apps/management-web/e2e/users-new-super-admin-full-crud.spec.ts`
- `.cursor/skills/use-form-component/SKILL.md`

## Session 2 - 2026-05-04

#### Prompt (Developer)

review the plan. is everything important finished? or did you missing anything? continue

#### Key Decisions

- Plan audit: prior Session 1 work matched the plan; Session 2 adds **reusable-components** notes for
  management-web **FormActions** (right-aligned footer) and **Select** vs raw selects.

#### Files Created/Modified

- `.cursor/skills/reusable-components/SKILL.md`

## Session 3 - 2026-05-05

#### Prompt (Developer)

complete that work

#### Key Decisions

- Canonical `PremiumBillingCadence` lives in `@metaboost/helpers`; ORM re-exports from helpers for `resolveDefaultMembershipExpiresAt`; `@metaboost/helpers-requests` CreateUserBody and management-web create-user defaults / UserForm use the shared type (removed duplicate UI-only alias).

#### Files Created/Modified

- `.llm/history/active/mgmt-create-user-ux/mgmt-create-user-ux-part-01.md`
- `packages/helpers/src/membership/premiumBillingCadence.ts`
- `packages/helpers/src/index.ts`
- `packages/orm/src/lib/defaultMembershipExpiresAt.ts`
- `packages/orm/src/index.ts`
- `packages/orm/src/services/UserService.ts`
- `packages/helpers-requests/src/types/management-user-types.ts`
- `apps/management-web/src/lib/createUserFormDefaults.ts`
- `apps/management-web/src/components/users/UserForm.tsx`

## Session 4 - 2026-05-06

#### Prompt (Developer)

Consolidate create-user form helpers (Metaboost + Podverse parity)

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- `toDateTimeLocalValue` in `@metaboost/helpers` now formats with **local** calendar fields (Podverse `toDatetimeLocalInputValue` parity), accepts `Date | number | string | null | undefined`, and returns `''` for invalid/nullish inputs; added `toDateTimeLocalValue.test.ts`.
- Introduced `PRODUCT_MEMBERSHIP_DEFAULTS_FROM_ENV_FALLBACK` as single source for env-parse defaults and client `fallbackProductMembershipFromEnv`.
- `createUserFormDefaults.ts`: removed duplicate `pad`/local formatter; uses shared `toDateTimeLocalValue`; kept app storage keys and `fallbackProductMembershipFromEnv` aligned with `ResolvedProductMembership`.

#### Files Created/Modified

- `packages/helpers/src/time/toDateTimeLocalValue.ts`
- `packages/helpers/src/time/toDateTimeLocalValue.test.ts`
- `packages/helpers/src/membership/productMembershipDefaultsFromEnv.ts`
- `packages/helpers/src/index.ts`
- `apps/management-web/src/lib/createUserFormDefaults.ts`
