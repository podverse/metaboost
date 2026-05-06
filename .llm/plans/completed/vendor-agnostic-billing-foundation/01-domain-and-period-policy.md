# 01 — Domain and Period Policy (Metaboost)

## Scope

- Define vendor-agnostic billing domain language for purchasable products.
- Centralize membership extension math with calendar-clamp monthly behavior.

## Steps

1. Add shared domain types for `BillingCadence`, `BillingProductCode`, and extension reasons.
2. Create or refine a pure period policy helper for:
   - extend from current expiry when still active
   - extend from now when expired or unset
   - monthly calendar clamp at month end
   - annual extension behavior aligned to the same policy surface
3. Route all membership expiry mutation paths through this policy helper.
4. Add deterministic unit tests for month-end and leap-year boundaries.

## Key files to touch later

- `packages/helpers/src/time/addMonths.ts`
- `packages/orm/src/lib/defaultMembershipExpiresAt.ts`
- `packages/orm/src/services/UserService.ts`
- `apps/management-web/src/lib/createUserFormDefaults.ts`

## Verification

- Unit tests prove Jan/Mar/Feb boundary behavior.
- All extension paths call one period policy helper.
- No service computes membership expiry using ad-hoc month arithmetic.
