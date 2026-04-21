# 03 Web Banner And Terms Page

## Scope

Implement user-facing terms UX:

- Persistent cross-app banner below navbar while upcoming terms need acceptance.
- `/terms` page renders DB-backed content for a user’s current accepted terms plus upcoming terms when relevant.
- Remove terms i18n prose support for this flow (single-language DB content only).

## Key Files

- [apps/web/src/app/layout.tsx](apps/web/src/app/layout.tsx)
- [apps/web/src/app/(main)/layout.tsx](apps/web/src/app/(main)/layout.tsx)
- [apps/web/src/components/NavBar.tsx](apps/web/src/components/NavBar.tsx)
- [apps/web/src/app/(main)/terms/page.tsx](apps/web/src/app/(main)/terms/page.tsx)
- [apps/web/src/app/(main)/terms-required/TermsRequiredPageClient.tsx](apps/web/src/app/(main)/terms-required/TermsRequiredPageClient.tsx)
- [apps/web/src/context/AuthContext.tsx](apps/web/src/context/AuthContext.tsx)
- [apps/web/src/lib/auth-user.ts](apps/web/src/lib/auth-user.ts)
- [apps/web/src/lib/server-auth.ts](apps/web/src/lib/server-auth.ts)

## Steps

1. Add a shared “terms reminder banner” component rendered below navbar in main layout.
2. Banner visibility logic from auth payload:
   - show when user has not accepted actionable upcoming terms and a deadline exists.
   - never dismissible until acceptance; no local-storage hide behavior.
3. Banner message copy includes deadline X and explicit impact:
   - “Agree to the new terms by X to continue receiving Metaboost messages.”
4. Banner CTA routes to `/terms` (or `/terms-required` if policy phase requires hard gate).
5. Replace static i18n terms body rendering with server-fetched DB terms content.
6. `/terms` conditional rendering rules:
   - pre-enforcement with upcoming terms: show both sets when the user has not yet accepted upcoming terms.
   - once accepted upcoming terms pre-enforcement: show user’s accepted-current terms plus upcoming acceptance state.
   - post-enforcement/grace end: old terms are `deprecated` and must not render; show current terms only.
7. Keep `/terms-required` flow using same acceptance endpoint, but display DB-backed terms content and clear acceptance target copy.
8. Remove terms-specific i18n keys and references that are replaced by DB content.
9. Apply hard-break behavior only; do not keep legacy terms-copy rendering paths.

## Verification

- E2E:
  - user with upcoming terms not accepted sees persistent banner on multiple pages.
  - user accepts terms; banner disappears across route transitions and reload.
  - `/terms` rendering switches correctly by phase and user acceptance.
  - enforced phase: only `current` terms rendered; `deprecated` terms never render.
