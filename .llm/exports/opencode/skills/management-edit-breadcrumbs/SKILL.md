---
name: management-edit-breadcrumbs
description: New and Edit pages in management-web should use breadcrumbs so users can see where they are and navigate back.
---


# Management-web New/Edit page breadcrumbs

**When to use:** When adding or changing New or Edit pages in management-web (e.g. new resource pages, edit resource pages).

## Rule

Every New and Edit page should show **breadcrumbs** so users can see their position in the hierarchy and navigate back:

- Wrap the page content in `ContentPageLayout` from `@metaboost/ui` with a `breadcrumbs` prop.
- Build `BreadcrumbItem[]`: list route (link) → optional view/resource link → current page label (no `href` for last item).
- Use `Breadcrumbs` and `Link` from `@metaboost/ui`; pass a `LinkComponent` that wraps `Link` (e.g. a small `BreadcrumbLink` that forwards `href`, `children`, `className`).
- Set `contentMaxWidth="form"` on `ContentPageLayout` for form pages.

## Hierarchy examples

- **Admins:** Admins (link) → Add admin | Edit: [name] (current).
- **Users:** Users (link) → Add user | [Name] (link) → Edit (current).
- **Buckets:** Buckets (link) → Add bucket (current).
- **Bucket message edit:** [Ancestor buckets] → Bucket name (link) → Edit (current). Fetch bucket and ancestry to build items.

## References

- User edit: `apps/management-web/src/app/(main)/user/[id]/edit/page.tsx`
- Admins new, admin edit, users new, buckets new: same pattern in respective `page.tsx` files.
- Bucket message edit: `apps/management-web/src/app/(main)/bucket/[id]/messages/[messageId]/edit/page.tsx` (fetches bucket + ancestry for breadcrumbs).
- Bucket settings (admins/roles edit) already have breadcrumbs via `BucketSettingsLayoutClient`.
