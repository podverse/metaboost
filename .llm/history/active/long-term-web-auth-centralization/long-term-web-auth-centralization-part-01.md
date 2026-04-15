### Session 1 - 2026-04-14

#### Prompt (Developer)

Long-Term Auth Centralization (Web)

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Centralized protected-route login redirects in proxy to always preserve `returnUrl` with path + query.
- Added header-only auth helpers (`getServerUserFromHeader`, `requireServerUserFromHeader`) so protected routes do not depend on `/auth/me`.
- Migrated protected web pages in `(main)` to use `requireServerUserFromHeader` and removed redundant page-level login redirects.
- Removed temporary retry logic from `getServerUser`; fallback `/auth/me` now uses a single request for non-protected contexts.
- Verified migration with lint diagnostics and static route/auth scans (no remaining protected-route `redirect(ROUTES.LOGIN)` checks).

#### Files Modified

- .llm/history/active/long-term-web-auth-centralization/long-term-web-auth-centralization-part-01.md
- apps/web/src/proxy.ts
- apps/web/src/lib/server-auth.ts
- apps/web/src/lib/routes.ts
- apps/web/src/app/(main)/dashboard/page.tsx
- apps/web/src/app/(main)/buckets/page.tsx
- apps/web/src/app/(main)/settings/page.tsx
- apps/web/src/app/(main)/bucket/[id]/page.tsx
- apps/web/src/app/(main)/bucket/[id]/new/page.tsx
- apps/web/src/app/(main)/bucket/[id]/bucket/new/page.tsx
- apps/web/src/app/(main)/bucket/[id]/messages/page.tsx
- apps/web/src/app/(main)/buckets/new/page.tsx
- apps/web/src/app/(main)/bucket/[id]/settings/layout.tsx
- apps/web/src/app/(main)/bucket/[id]/settings/admins/[userId]/edit/page.tsx
- apps/web/src/app/(main)/bucket/[id]/settings/roles/new/page.tsx
- apps/web/src/app/(main)/bucket/[id]/settings/roles/[roleId]/edit/page.tsx
