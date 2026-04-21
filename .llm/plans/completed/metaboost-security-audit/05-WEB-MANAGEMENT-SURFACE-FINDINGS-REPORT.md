# Plan 05 Output - Web/Management-Web Attack-Surface Findings

## Scope Reviewed

- `apps/web/src/proxy.ts`
- `apps/web/src/lib/server-auth.ts`
- `apps/web/src/app/(auth)/login/page.tsx`
- `apps/web/src/lib/routes.ts`
- `apps/web/src/app/(main)/bucket/[id]/settings/roles/new/page.tsx`
- `apps/web/src/app/(main)/bucket/[id]/settings/roles/BucketRoleFormClient.tsx`
- `apps/management-web/src/proxy.ts`
- `apps/management-web/src/lib/server-auth.ts`
- `apps/management-web/src/lib/routes.ts`
- `apps/management-web/src/app/(main)/admins/roles/new/page.tsx`
- `apps/management-web/src/components/admins/AdminRoleForm.tsx`
- `apps/management-web/src/app/(main)/bucket/[id]/settings/roles/new/page.tsx`
- `apps/management-web/src/app/(main)/bucket/[id]/settings/roles/[roleId]/edit/page.tsx`
- `apps/management-web/src/app/(main)/bucket/[id]/settings/roles/BucketRoleFormClient.tsx`

## Findings (Ordered by Severity)

### 1) Medium - Open-redirect style navigation via unvalidated `returnUrl` on role workflows

- **Evidence**
  - `apps/management-web/src/app/(main)/admins/roles/new/page.tsx`:
    - `const returnUrl = resolvedSearch.returnUrl ?? ROUTES.ADMINS;`
    - passed directly into `AdminRoleForm`.
  - `apps/management-web/src/components/admins/AdminRoleForm.tsx`:
    - `router.push(returnUrl)` on success.
    - `router.push(cancelUrl)` on cancel.
  - `apps/management-web/src/app/(main)/bucket/[id]/settings/roles/new/page.tsx` and
    `.../roles/[roleId]/edit/page.tsx`:
    - `returnUrl` is taken from query params and assigned to `successHref`/`cancelHref`.
  - `apps/management-web/src/app/(main)/bucket/[id]/settings/roles/BucketRoleFormClient.tsx`:
    - `window.location.href = successHref;`
    - `<ButtonLink href={cancelHref}>`.
  - Equivalent pattern in web app:
    - `apps/web/src/app/(main)/bucket/[id]/settings/roles/new/page.tsx`
    - `apps/web/src/app/(main)/bucket/[id]/settings/roles/BucketRoleFormClient.tsx`
- **Exploit Preconditions**
  - Victim is authenticated and visits a crafted URL containing external or attacker-controlled `returnUrl`.
  - Victim clicks cancel or successfully submits role form.
- **Impact**
  - User can be redirected to attacker-controlled destinations from trusted UI flows.
  - Primarily phishing/trust-boundary abuse, not direct backend auth bypass.
- **Mitigation Options**
  - Apply centralized safe-return validation (same-origin relative paths only, reject `//`, external schemes).
  - Prefer route helpers that canonicalize allowed destinations.
  - Fall back to known-safe internal route when validation fails.

### 2) Medium - Management-web auth gate can be bypassed at proxy layer by presence-only session cookie check

- **Evidence**
  - `apps/management-web/src/proxy.ts`:
    - `const hasSession = request.cookies.has(SESSION_COOKIE_NAME) || hasRestoredSession;`
    - Protected-route redirect is skipped whenever session cookie exists, even if invalid.
  - `trySessionRestore` returning non-restored state on failed `/auth/me` + `/auth/refresh` does not clear invalid cookie or mark session invalidated.
- **Exploit Preconditions**
  - Attacker can send arbitrary request with fake `management_api_session` cookie to management-web.
- **Impact**
  - Proxy-level route protection can be bypassed for initial page access decisions.
  - Backend API still enforces auth, so direct data/actions should remain blocked.
  - Can still expand UI attack surface and interact with client-side flows unexpectedly.
- **Mitigation Options**
  - Mirror web-app behavior:
    - treat failed restore as invalidated session,
    - clear stale session/refresh cookies,
    - require validated session for protected routes.

### 3) Low-Medium - `x-auth-user` trusted as authoritative without integrity mechanism

- **Evidence**
  - `apps/web/src/lib/server-auth.ts` and `apps/management-web/src/lib/server-auth.ts` prefer `x-auth-user` header if present.
  - Middleware/proxy injects this header, but consumer does not cryptographically verify provenance.
- **Exploit Preconditions**
  - Upstream or deployment path allows spoofed request headers to reach app server.
  - Proxy/session checks are weak or bypassed (more relevant to management-web finding above).
- **Impact**
  - Potential for frontend authorization-state spoofing in SSR checks.
  - Backend API remains primary enforcement boundary.
- **Mitigation Options**
  - Strip inbound `x-auth-user` before app handling and only set trusted internal value.
  - Optionally sign/encrypt internal auth context header if it must traverse hops.
  - Ensure protected pages can never rely solely on spoofable header without verified session.

## Positive Controls Observed

- Web login and proxy use explicit safe return-url checks:
  - relative path required,
  - `//` rejected,
  - login/signup self-redirect loops prevented.
- Web proxy attempts session restore and marks invalid sessions for cookie clearing.
- Protected routing in both apps defaults to redirecting unauthenticated users to login when no session indicator exists.

## Prioritized Mitigation Recommendations

1. **Highest priority:** fix unvalidated `returnUrl` handling in both apps’ role flows.
2. Harden management-web proxy session validity logic to require validated session, not cookie presence.
3. Add defensive guardrails for trusted auth header usage (`x-auth-user`) and strip/replace inbound values.

## Plan 05 Completion Checklist

- [x] Redirect source/sink paths reviewed (login proxy flows and returnUrl usages).
- [x] Header trust assumptions reviewed for `x-auth-user`.
- [x] Web and management-web findings documented with exploit preconditions.
- [x] No code fixes implemented.
