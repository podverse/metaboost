# 05 — Management Pricing Governance (Metaboost)

## Scope

- Add billing-focused management API and management-web governance for pricing operations.
- Keep UI scope limited to pricing and membership-product surfaces.

## Steps

1. Extend management permission model for pricing governance operations.
   - add required CRUD permission dimensions in management schema/migrations
   - wire authz checks for list/create/schedule/activate/deprecate operations
2. Add management API routes/controllers/schemas for pricing lifecycle.
   - list active and scheduled prices
   - create/schedule effective-window changes
   - deprecate or supersede pricing rows with audit trail entries
3. Add billing-focused management-web pages or sections:
   - product membership defaults visibility
   - pricing history and upcoming effective changes
   - mutation flows with clear validation messaging
4. Update i18n keys only for billing-adjacent UI introduced in this phase.
5. Add E2E coverage for management pricing governance workflows.

## Key files to touch later

- `apps/management-api/src/lib/database/tablePolicy.ts`
- `apps/management-api/src/lib/authz/`
- `apps/management-api/src/routes/`
- `apps/management-api/src/schemas/`
- `apps/management-web/src/app/(management)/products/`
- `apps/management-web/e2e/`

## Verification

- Pricing governance endpoints are permission-guarded and auditable.
- Management-web can list and update pricing without touching unrelated UI domains.
- E2E confirms core create/read/update/deprecate pricing behavior.
- No feed/parser/lifecycle UI or route changes are introduced in this phase.
