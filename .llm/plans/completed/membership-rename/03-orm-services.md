# 03 — ORM services

## Scope

Update services that read/write membership rows and raw SQL against the table.

## Steps

1. **UserService** ([packages/orm/src/services/UserService.ts](packages/orm/src/services/UserService.ts)):
   - `USER_RELATIONS`: `'membership'`
   - Repository `UserMembership`
   - Rename `upsertTrustSettings` → `upsertMembership`

2. **BillingRenewalOrchestratorService** ([packages/orm/src/services/billingRenewalOrchestrator.ts](packages/orm/src/services/billingRenewalOrchestrator.ts)):
   - `FROM user_membership` in raw SQL
   - `getRepository(UserMembership)`

3. **MembershipPeriodExtensionService** ([packages/orm/src/services/membershipPeriodExtension.ts](packages/orm/src/services/membershipPeriodExtension.ts)):
   - `getRepository(UserMembership)`
   - Local variable `membership` (not `trust`)
   - Error messages reference "membership"

## Key files

- `packages/orm/src/services/UserService.ts`
- `packages/orm/src/services/billingRenewalOrchestrator.ts`
- `packages/orm/src/services/membershipPeriodExtension.ts`

## Verification

```bash
npm run build -w @metaboost/orm
rg "user_trust_settings|UserTrustSettings|trustSettings" packages/orm/src
```

Expect no matches.
