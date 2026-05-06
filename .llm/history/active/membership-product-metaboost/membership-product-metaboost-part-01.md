# membership-product-metaboost

**Started:** 2026-05-04  
**Author:** Cursor Agent  
**Context:** Parity with Podverse membership product defaults — API-driven management-web, shared K8s ConfigMap, `@metaboost/helpers` resolver.

---

### Session 1 - 2026-05-04

#### Prompt (Developer)

continue

#### Key Decisions

- **`@metaboost/helpers`**: New `membership/membershipProductDefaultsFromEnv.ts` with `DEFAULT_FREE_TRIAL_EXPIRATION_SECONDS`, `MembershipProductDefaultsFromEnv`, and lenient `resolveMembershipProductDefaultsFromEnv()` (trial + premium monthly/annual). Package `exports` includes subpath `./membership/membershipProductDefaultsFromEnv.js` for Vitest/runtime parity with Podverse.
- **`@metaboost/orm`**: `freeTrialExpirationSeconds.ts` imports shared default constant from helpers subpath (single source for 31-day default).
- **management-api**: `GET {version}/membership-product-defaults` — super-admin only, returns `{ data: resolveMembershipProductDefaultsFromEnv() }`; OpenAPI 0.1.3 + schemas.
- **helpers-requests**: `managementWebMembershipProductDefaults.getMembershipProductDefaults`.
- **management-web**: Create-user flow fetches defaults; loading gate; `computeDefaultMembershipExpiresAtInput` takes `trialExpirationSeconds`; removed `NEXT_PUBLIC_FREE_TRIAL_EXPIRATION` from runtime-config, runtime-config-store, sidecar, K8s sidecar env, `.env.example`.
- **K8s**: `infra/k8s/base/membership-product/` → ConfigMap `metaboost-membership-product-config`; included in api + management-api kustomizations; `envFrom` last on api and management-api deployments; deduped overlapping keys from `api.env` and `management-api.env`.

#### Files Created/Modified

- `packages/helpers/src/membership/membershipProductDefaultsFromEnv.ts`
- `packages/helpers/package.json`
- `packages/helpers/src/index.ts`
- `packages/orm/src/lib/freeTrialExpirationSeconds.ts`
- `packages/helpers-requests/src/management-web/membershipProductDefaults.ts`
- `packages/helpers-requests/src/index.ts`
- `apps/management-api/src/app.ts`
- `apps/management-api/src/openapi.ts`
- `apps/management-api/src/test/management-api.test.ts`
- `apps/management-web/src/lib/createUserFormDefaults.ts`
- `apps/management-web/src/components/users/UserForm.tsx`
- `apps/management-web/src/config/runtime-config.ts`
- `apps/management-web/src/config/runtime-config-store.ts`
- `apps/management-web/sidecar/src/server.ts`
- `apps/management-web/sidecar/.env.example`
- `infra/k8s/base/membership-product/kustomization.yaml`
- `infra/k8s/base/membership-product/source/membership-product-defaults.env`
- `infra/k8s/base/api/kustomization.yaml`
- `infra/k8s/base/api/deployment.yaml`
- `infra/k8s/base/api/source/api.env`
- `infra/k8s/base/management-api/kustomization.yaml`
- `infra/k8s/base/management-api/deployment.yaml`
- `infra/k8s/base/management-api/source/management-api.env`
- `infra/k8s/base/management-web/source/management-web-sidecar.env`

### Session 2 - 2026-05-05

#### Prompt (Developer)

# Trial/pricing/RSS limits: management-web loads `/api/v2/membership-product-defaults` from management-api (podverse-membership-product-config on api + management-api).

i am thinking we should follow a convention like

/api/v2/product/membership/defaults

where product represents anything a user of this app can purchase from the site.

as we may potentially offer more products than memberships in the future. both podverse and metaboost should follow this convention (i am not sure if metaboost has memberships yet but there may be active plans you can update to make sure they are aligned with these goals)

#### Key Decisions

- Adopted canonical product endpoint path for membership defaults:
  - `/v1/product/membership/defaults` (new canonical path)
  - `/v1/membership-product-defaults` (kept as backward-compatible alias)
- Updated management-web client request helper to the canonical path.
- Updated OpenAPI to document canonical path and mark legacy path as deprecated alias.
- Updated management-web sidecar env comments to reference the canonical path.
- No active plan files in `.llm/plans/active` referenced this endpoint path, so no plan updates were required.

#### Files Created/Modified

- `.llm/history/active/membership-product-metaboost/membership-product-metaboost-part-01.md`
- `apps/management-api/src/app.ts`
- `apps/management-api/src/openapi.ts`
- `apps/management-api/src/test/management-api.test.ts`
- `packages/helpers-requests/src/management-web/membershipProductDefaults.ts`
- `infra/k8s/base/management-web/source/management-web-sidecar.env`
- `apps/management-web/sidecar/.env.example`

### Session 3 - 2026-05-05

#### Prompt (Developer)

@podverse/apps/management-api/src/routes/membershipProductDefaults.ts:1-36 we do not want any references to "legacy path" check all of the non-committed changes and make sure it uses hard breaks and does not hang onto "legacy" handling

#### Key Decisions

- Enforced hard-break endpoint behavior by removing backward-compatible alias handling:
  - kept only `/v1/product/membership/defaults`
  - removed `/v1/membership-product-defaults` route and compatibility docs/tests
- Verified Metaboost management-api compiles after the hard-break cutover.

#### Files Created/Modified

- `.llm/history/active/membership-product-metaboost/membership-product-metaboost-part-01.md`
- `apps/management-api/src/app.ts`
- `apps/management-api/src/openapi.ts`
- `apps/management-api/src/test/management-api.test.ts`

### Session 4 - 2026-05-05

#### Prompt (Developer)

Product Membership Global Rename Plan

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Hard-break renamed membership product surfaces to product membership naming in code and files.
- Changed management-api defaults endpoint from `/v1/product/membership/defaults` to `/v1/product/membership`.
- Renamed helpers and helpers-requests module names/types/functions from `membershipProduct*` to `productMembership*`.
- Renamed K8s component and ConfigMap from `membership-product` to `product-membership` with atomic reference updates.
- Updated `.cursor` expiration-naming rule glob and skill reference to the renamed helper module file.

#### Files Created/Modified

- `.llm/history/active/membership-product-metaboost/membership-product-metaboost-part-01.md`
- `.cursor/rules/env-expiration-naming.mdc`
- `.cursor/skills/env-expiration-naming/SKILL.md`
- `apps/management-api/src/app.ts`
- `apps/management-api/src/openapi.ts`
- `apps/management-api/src/test/management-api.test.ts`
- `apps/management-web/sidecar/.env.example`
- `apps/management-web/src/components/users/UserForm.tsx`
- `apps/management-web/src/lib/createUserFormDefaults.ts`
- `infra/k8s/base/api/deployment.yaml`
- `infra/k8s/base/api/kustomization.yaml`
- `infra/k8s/base/api/source/api.env`
- `infra/k8s/base/management-api/deployment.yaml`
- `infra/k8s/base/management-api/kustomization.yaml`
- `infra/k8s/base/management-api/source/management-api.env`
- `infra/k8s/base/management-web/source/management-web-sidecar.env`
- `infra/k8s/base/product-membership/kustomization.yaml`
- `infra/k8s/base/product-membership/source/product-membership-defaults.env`
- `packages/helpers/package.json`
- `packages/helpers/src/index.ts`
- `packages/helpers/src/membership/productMembershipDefaultsFromEnv.ts`
- `packages/helpers-requests/src/index.ts`
- `packages/helpers-requests/src/management-web/productMembershipDefaults.ts`
- `packages/orm/src/lib/freeTrialExpirationSeconds.ts`

### Session 5 - 2026-05-05

#### Prompt (Developer)

complete anythig needed but you don't need to commit or run tests

#### Key Decisions

- Confirmed no remaining `membership-product` / old defaults path references in Metaboost app code, packages, `infra/k8s`, or `infra/config` (only historical lines in other `.llm/history` files).
- Skipped commit and test runs per request.

#### Files Created/Modified

- `.llm/history/active/membership-product-metaboost/membership-product-metaboost-part-01.md`
