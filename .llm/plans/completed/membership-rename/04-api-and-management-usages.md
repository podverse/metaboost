# 04 — API and management-api usages

## Scope

Update auth middleware, billing read model, management user CRUD, and integration tests.

## Steps

1. **requireAuth** ([apps/api/src/middleware/requireAuth.ts](apps/api/src/middleware/requireAuth.ts)):
   - `Reflect.get(value, 'membership')` for `membershipExpiresAt`

2. **billingController** ([apps/api/src/controllers/billingController.ts](apps/api/src/controllers/billingController.ts)):
   - `user.membership`

3. **billingReadModelSerialization** ([apps/api/src/lib/billingReadModelSerialization.ts](apps/api/src/lib/billingReadModelSerialization.ts)):
   - `params.user.membership`
   - Rename `premiumBillingCadenceFromTrust` → `premiumBillingCadenceFromMembership`

4. **management usersController** ([apps/management-api/src/controllers/usersController.ts](apps/management-api/src/controllers/usersController.ts)):
   - `user.membership` in `userToJson`
   - `leftJoinAndSelect('user.membership', 'membership')`
   - `UserService.upsertMembership`

5. **Integration test** ([apps/api/src/test/billing-renewal-orchestrator.test.ts](apps/api/src/test/billing-renewal-orchestrator.test.ts)):
   - SQL `user_membership`
   - `refreshed?.membership`

## Key files

- `apps/api/src/middleware/requireAuth.ts`
- `apps/api/src/controllers/billingController.ts`
- `apps/api/src/lib/billingReadModelSerialization.ts`
- `apps/management-api/src/controllers/usersController.ts`
- `apps/api/src/test/billing-renewal-orchestrator.test.ts`

## Verification

```bash
npm run build -w apps/api
npm run build -w apps/management-api
npm run test:e2e:api
```
