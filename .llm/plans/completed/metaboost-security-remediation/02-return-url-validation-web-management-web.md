# 02 - Return URL Validation in Web and Management-Web

## Priority

- Severity: Medium
- Rollout risk: Low-Medium
- Bucket: P2 (quick win)

## Scope

Remediate:

- M1: unvalidated `returnUrl` sinks in role flows.

## Steps

1. Introduce or centralize a safe-return-url utility for frontend navigation sinks.
2. Enforce same-origin relative route policy:
   - allow only internal relative paths;
   - reject absolute external URLs and protocol-relative values (`//...`).
3. Apply sink-level validation before all `router.push`, `window.location.href`, and equivalent role-flow redirects.
4. Define deterministic fallback route for invalid `returnUrl` values.
5. Ensure behavior is consistent across web and management-web role flows (new/edit/success/cancel paths).

## Key Files

- `apps/web/src/app/(main)/bucket/[id]/settings/roles/new/page.tsx`
- `apps/web/src/app/(main)/bucket/[id]/settings/roles/BucketRoleFormClient.tsx`
- `apps/management-web/src/app/(main)/admins/roles/new/page.tsx`
- `apps/management-web/src/components/admins/AdminRoleForm.tsx`
- `apps/management-web/src/app/(main)/bucket/[id]/settings/roles/new/page.tsx`
- `apps/management-web/src/app/(main)/bucket/[id]/settings/roles/[roleId]/edit/page.tsx`
- `apps/management-web/src/app/(main)/bucket/[id]/settings/roles/BucketRoleFormClient.tsx`
- Shared route/safety helpers in web and management-web libs

## Verification

1. Add/update E2E coverage:
   - valid internal return URL preserves intended navigation;
   - invalid external `returnUrl` falls back safely;
   - protocol-relative and malformed values are rejected.
2. Verify both web and management-web role create/edit cancel/success flows.
3. Confirm no regressions in existing safe return-url behavior already used by login/proxy flows.

## Deliverable

- Redirect sinks in role workflows are safe by default across both frontend apps.
