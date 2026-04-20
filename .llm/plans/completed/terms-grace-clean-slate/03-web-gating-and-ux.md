# Phase 3 - Web Gating and UX

## Scope

Drive web behavior from policy phase and acceptance status while keeping one shared terms copy.

## Steps

1. Keep shared terms content component as canonical legal copy for:
   - static `/terms`
   - interactive `/terms-required`
2. Extend web auth user/session types to include policy state fields returned by API.
3. Update middleware/proxy gating:
   - if `mustAcceptNow` true -> redirect to `/terms-required`
   - if `mustAcceptNow` false -> allow app routes (including grace/announcement)
   - if accepted and visiting `/terms-required` -> redirect to dashboard.
4. Update terms-required page UX:
   - display phase-aware banner copy:
     - announcement: informational notice
     - grace: warning with enforcement date
     - enforced: blocking notice
   - first sentence declares terms are authored by the site owner and interpolates `LEGAL_NAME`
     through i18n.
   - keep agreement checkbox + submit
   - keep More Options delete-account flow.
5. Ensure static `/terms` remains browsable at any time.
6. Ensure terms copy remains generic after sentence one, so content still makes sense without
   repeated `LEGAL_NAME` substitutions.
7. Update i18n keys for phase-aware copy and terms sentence interpolation:
   - add/update translated terms keys (not hardcoded English-only strings)
   - verify all supported locales render safely when `LEGAL_NAME` is missing or empty.

## Key Files

- `/Users/mitcheldowney/repos/pv/metaboost/apps/web/src/proxy.ts`
- `/Users/mitcheldowney/repos/pv/metaboost/apps/web/src/context/AuthContext.tsx`
- `/Users/mitcheldowney/repos/pv/metaboost/apps/web/src/lib/server-auth.ts`
- `/Users/mitcheldowney/repos/pv/metaboost/apps/web/src/app/(main)/terms/page.tsx`
- `/Users/mitcheldowney/repos/pv/metaboost/apps/web/src/app/(main)/terms-required/`
- `/Users/mitcheldowney/repos/pv/metaboost/apps/web/i18n/originals/en-US.json`
- `/Users/mitcheldowney/repos/pv/metaboost/apps/web/i18n/originals/es.json`
- `/Users/mitcheldowney/repos/pv/metaboost/apps/web/i18n/overrides/es.json`

## Verification

- E2E redirect behavior:
  - enforced + not accepted => blocked to `/terms-required`
  - grace + not accepted => allowed with warning
  - accepted => app routes normal.
- Terms text parity between `/terms` and `/terms-required` remains intact.
- Terms first sentence correctly renders `LEGAL_NAME` from runtime env in each locale.
