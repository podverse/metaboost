# Bucket owner and admins

How the boilerplate treats the **owner** of a bucket vs **bucket admins**, and how CRUD is enforced.
Buckets can be nested, but governance is **root-scoped**: descendant buckets inherit owner/admin/settings from their root bucket.
**Admins and invitations are assigned via role selection** (predefined or custom roles).

## Owner

- **Full CRUD**: The owner always has full CRUD on the bucket and its messages. This is enforced in **`apps/api/src/lib/bucket-policy.ts`**: every `can*` function returns `true` when `bucket.ownerId === userId`. Admins get access only per their `bucket_crud` and `bucket_messages_crud` bitmasks.
- **Root-scoped governance**: Owner/admin/settings are managed on the root bucket. Descendant buckets inherit these values.
- **Cannot be edited or removed**: The owner's abilities are not removable. In **`apps/api/src/controllers/bucketAdminsController.ts`**:
  - **PATCH** (update admin): returns `403` with "Bucket owner cannot be edited" if the target user is the owner.
  - **DELETE** (remove admin): returns `403` with "Bucket owner cannot be removed" if the target user is the owner.
- **UI**: In **`packages/ui`** `BucketAdminsView`, the owner row shows an "Owner" label and **no** Edit/Delete buttons (`a.userId === ownerId`). Only non-owner admins get CRUD actions.

## Roles (predefined and custom)

- **Predefined roles** (same for all buckets): Full, No update, No delete, Read only. Defined in **`packages/helpers/src/bucketRoles/constants.ts`**. Shown in the management-web **Roles** tab as read-only.
- **Custom roles**: Stored in the `bucket_role` table, per bucket. Created and edited on the **Create role** and **Edit role** pages. The **Roles** tab lists predefined and custom roles; custom roles have Edit and Delete.
- **Add/Edit admin**: A **role dropdown** (predefined + custom) is used when adding an invitation or editing an admin; the selected role's CRUD is applied. Permission checkboxes appear only on the role create/edit pages.

See: Bucket settings → **Roles** tab; `/bucket/:id/settings/roles/new`, `/bucket/:id/settings/roles/:roleId/edit`.

## Admins

- **Selective CRUD**: Bucket admins have permissions stored per row: `bucket_crud`, `bucket_messages_crud`, and `bucket_admins_crud`. These are bitmasks (create/read/update/delete). Admins and invitations are assigned via **role selection** (the role's CRUD is applied).
- **Root-only mutation on descendants**: Descendant buckets can be renamed, but admin/role/invitation/settings mutations are rejected and must be performed on the root bucket.
- **Editable/removable**: Non-owner admins can be updated (change role) or removed by users who have "manage bucket admins" (owner or admin with bucket update).

## Summary

| Role  | Bucket/message CRUD             | Editable/removable in Settings       |
| ----- | ------------------------------- | ------------------------------------ |
| Owner | Full (always)                   | No (row is display-only)             |
| Admin | Per role (predefined or custom) | Yes (by users who can manage admins) |
