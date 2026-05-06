# drop-defaults-resolved-membership

**Started:** 2026-05-06  
**Author:** Cursor Agent  
**Context:** Align resolved membership naming with Podverse; drop "defaults" outside env-bootstrap layer.

---

### Session 1 - 2026-05-06

#### Prompt (Developer)

Drop "Defaults" From Resolved Membership (Podverse Parity)

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Kept `ProductMembershipDefaultsFromEnv` / `resolveProductMembershipDefaultsFromEnv` / `productMembershipDefaultsFromEnv.ts` unchanged (env-bootstrap only; Podverse parity).
- Renamed management-api OpenAPI and helpers-requests client to `ResolvedProductMembership` / `getResolvedProductMembership` / `managementWebProductMembership`; flattened public `GET /product/membership` JSON: no nested `membershipDefaults` (flat `ResolvedProductMembership` fields + `listPriceCurrencyCode` + `selfServePublicSignupOpen`).
- Renamed K8s source file to `product-membership-settings.env`; i18n key `billingGovernance.resolvedMembership`.
- Ran `npm run lint` (pass). Prettier also fixed `.cursor/skills/INDEX.md` and `packages/helpers/src/time/toDateTimeLocalValue.ts` (were failing `prettier --check` on the branch).

#### Files Created/Modified

- `packages/helpers-requests/src/management-web/productMembership.ts` (replaces `productMembershipDefaults.ts`)
- `packages/helpers-requests/src/index.ts`
- `packages/helpers/src/membership/billingReadModelTypes.ts`
- `packages/helpers-requests/src/web/product.ts` (comment)
- `packages/helpers/src/membership/resolvedProductMembership.ts`
- `apps/api/src/lib/billingReadModelSerialization.ts`
- `apps/api/src/controllers/productController.ts`
- `apps/api/src/openapi.ts`
- `apps/api/src/routes/product.ts`
- `apps/api/src/test/product-membership.test.ts`
- `apps/management-api/src/openapi.ts`
- `apps/management-web/src/components/users/UserForm.tsx`
- `apps/management-web/src/lib/createUserFormDefaults.ts`
- `apps/management-web/src/app/(main)/products/membership/ProductsMembershipClient.tsx`
- `apps/management-web/e2e/products-membership-billing.spec.ts`
- `apps/management-web/i18n/originals/en-US.json`, `es.json`, `overrides/es.json`
- `infra/k8s/base/product-membership/source/product-membership-settings.env` (replaces `product-membership-defaults.env`)
- `infra/k8s/base/product-membership/kustomization.yaml`
- `infra/k8s/INFRA-K8S-BASE.md`
- `infra/k8s/base/management-web/source/management-web-sidecar.env` (comment)
- `.cursor/skills/INDEX.md`, `packages/helpers/src/time/toDateTimeLocalValue.ts` (prettier only)
