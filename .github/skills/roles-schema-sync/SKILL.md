---
name: roles-schema-sync
description: When changing DB schema or permission dimensions, consider predefined roles and bucket_role / role-related code.
---

# Roles and schema / permission changes

## When to use

When changing **DB schema** (especially permission-related columns or new resource types), or when **adding/removing CRUD dimensions** for bucket admins.

## What to consider

1. **Predefined roles** are defined in code (`packages/helpers/src/bucketRoles/constants.ts`) and may need:
   - New entries (e.g. a new predefined role id and nameKey).
   - Updated bitmasks (`bucketCrud`, `bucketMessagesCrud`, `bucketAdminsCrud`) if CRUD semantics change.
   - i18n keys in apps (e.g. `roles.full`, `roles.noUpdate`) and in management-web/originals.

   Use parent-prefixed names for nested resources (e.g. `bucketMessagesCrud`); see **nested-resource-prefix-naming**.

2. **Custom roles** live in schema tables (`bucket_role`, `management_admin_role`). Adding columns or changing CRUD semantics may require:
   - Migrations and init SQL updates together (keep both in sync):
     - Main DB: `infra/k8s/base/db/postgres-init/0003_app_schema.sql` (canonical)
     - Management DB: `infra/k8s/base/db/postgres-init/0005_management_schema.sql.frag` (canonical)
   - ORM entity and `BucketRoleService` updates.
   - Management-api schemas (Joi), controller, and OpenAPI updates.
   - Helpers-requests types and API helpers.

3. **UI** that lists or applies roles (dropdowns, Roles tab, role create/edit forms) may need to:
   - Reflect new permission dimensions or labels.
   - Update CrudCheckboxes or role option shapes if CRUD bits change.

## Key files

- Predefined: `packages/helpers/src/bucketRoles/constants.ts`
- DB (main): `infra/k8s/base/db/postgres-init/0003_app_schema.sql`
- DB (management): `infra/k8s/base/db/postgres-init/0005_management_schema.sql.frag`
- ORM: `packages/orm` (BucketRole entity, BucketRoleService)
- API: `apps/management-api` (bucket roles routes, controller, schemas)
- Client: `packages/helpers-requests` (bucket roles), `packages/ui` (BucketAdminsView, EditBucketAdminForm, BucketSettingsTabs)
