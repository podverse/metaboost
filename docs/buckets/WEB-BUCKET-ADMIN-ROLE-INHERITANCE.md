# Web Bucket Admin/Role Inheritance

This document explains how bucket owner/admin/role permissions work for the web app, how inheritance from the top-level bucket is applied, and what differs across `rss-network`, `rss-channel`, and `rss-item`.

## Short answer

Yes. Governance is root-scoped. The API resolves an "effective bucket" (the top/root ancestor), and owner/admin/role checks are performed against that root bucket.

For descendants (channel/item), the system uses inherited governance from the root, not separate descendant-specific admin/role configuration.

## Core model

- **Owner**: Always full CRUD for bucket + messages + admin/role management.
- **Bucket admins**: Have bitmask permissions (`bucketCrud`, `bucketMessagesCrud`, `bucketAdminsCrud`).
- **Roles**:
  - Predefined roles are global constants.
  - Custom roles are stored per root bucket.
  - Admins/invitations are assigned by role selection (role resolves to CRUD masks).

## Where inheritance is implemented

### 1) Effective/root bucket resolution

- `apps/api/src/lib/bucket-effective.ts` resolves:
  - `bucket` (requested node)
  - `effectiveBucket` (root ancestor)
  - `isDescendant`
- Permission checks and admin/role lookups use `effectiveBucket.id`.

### 2) Bucket-scoped permission gate

- `apps/api/src/lib/bucket-context.ts`:
  - Loads `resolved` (with `effectiveBucket`).
  - Loads bucket admin row using `BucketAdminService.findByBucketAndUser(effectiveBucket.id, user.id)`.
  - Supports `requireRoot` for root-only mutations.

### 3) Policy bits

- `apps/api/src/lib/bucket-policy.ts`:
  - Owner short-circuit (`true`).
  - Admin permissions via CRUD bitmasks.
  - Manage-admins/manage-roles uses bucket update bit.

## What is inherited to descendants

Descendants (`rss-channel`/`rss-item`) inherit governance from root:

- Owner identity for effective access.
- Admin membership and CRUD masks.
- Roles (predefined + root bucket custom roles).
- Effective owner identity in policy checks.

General bucket settings are now per-bucket (not root-overridden in read payloads), while admin/role governance remains root-scoped.

## Root-only operations

The backend enforces root-only mutation for governance resources:

- Admins: `apps/api/src/controllers/bucketAdminsController.ts` (`requireRoot: true`)
- Roles: `apps/api/src/controllers/bucketRolesController.ts` (`requireRoot: true`)
- Admin invitations: `apps/api/src/controllers/bucketAdminInvitationsController.ts` (`requireRoot: true`)

If called on descendants, these return root-only errors.

## Web app behavior

- Settings tab is available for all buckets in web and management-web.
- Descendants keep their own editable General settings (for example `isPublic`, `messageBodyMaxLength`).
- `messageBodyMaxLength` is always required and bounded (`140..2500`); root buckets default to `500`, descendants inherit from their immediate parent on create.
- Admins/Roles tabs are shown only for top-level buckets (`parentBucketId === null`).
- Web auth helpers align with API policy:
  - `apps/web/src/lib/bucket-authz.ts` treats owner as full CRUD and checks admin masks.
- Role pickers in settings are built from predefined + custom role data:
  - `apps/web/src/app/(main)/bucket/[id]/BucketAdminsClient.tsx`
  - `packages/helpers-requests/src/bucketAdminRoleOptions.ts`
- Saving General settings on a bucket with children prompts for scope:
  - This bucket only
  - This bucket plus all descendants recursively
- Descendant visibility guardrail:
  - Descendants can only be set `isPublic: true` when every ancestor is public.
  - Descendants can always be set `isPublic: false`.

## RSS type nuances

### `rss-network` (root governance anchor)

- Top-level container where governance is normally managed.
- Only bucket type that can create child buckets via UI/API child-create flow.
- Allowed child type: `rss-channel` only.

### `rss-channel` (usually descendant, can also be top-level)

- If top-level: it is its own root, so governance is managed directly on it.
- If under `rss-network`: governance is inherited from network root.
- RSS verify/sync for a channel creates/updates `rss-item` buckets and keeps orphan state.

### `rss-item` (always descendant in practice)

- Created/managed by RSS sync flow, not by manual child-create endpoint.
- Inherits governance from channel/network root via effective-bucket resolution.
- No separate item-level admin/role model.

## Important practical implications

- Giving someone admin on the root grants access across its descendant channels/items according to CRUD masks.
- You cannot define a different admin list or custom role set for one item under a channel.
- Descendants can have independent General settings, optionally cascaded from any ancestor during save.
- `rss-channel` and `rss-item` names are derived from RSS metadata and are not manually editable.
- `findAccessibleByUser` list views are root-focused; descendants are discovered through bucket navigation, not top-level ownership listings.

## Message behavior in RSS hierarchy

- MB1 message creation targets `rss-channel` buckets. `rss-network` is not a valid MB1 message target.
- `rss-item` buckets receive messages when an MB1 boost includes an item GUID that maps to a synced item bucket.
- On an `rss-network` messages tab, message listing is an aggregate over descendant `rss-channel` and `rss-item` buckets.
- The aggregate list is sorted by `createdAt` descending by default (`recent`), and ascending when `sort=oldest`.
- Network aggregate views intentionally exclude messages directly attached to the network bucket row.

## Related docs

- `docs/buckets/OWNER-AND-ADMINS.md`
- `apps/api/src/lib/BUCKET-POLICY.md`
