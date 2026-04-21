# 04 Management Web Admin Tools

## Scope

Add admin UI to manage terms lifecycle and scheduling without direct SQL.

## Key Files

- [apps/management-web/src/lib/routes.ts](apps/management-web/src/lib/routes.ts)
- [apps/management-web/src/lib/main-nav.ts](apps/management-web/src/lib/main-nav.ts)
- [apps/management-web/src/components/ResourceTableWithFilter.tsx](apps/management-web/src/components/ResourceTableWithFilter.tsx)
- [apps/management-web/src/app/(main)](apps/management-web/src/app/(main))
- [apps/management-web/i18n/originals/en-US.json](apps/management-web/i18n/originals/en-US.json)
- [packages/helpers-requests](packages/helpers-requests)

## Steps

1. Introduce new admin resource routes/pages:
   - terms versions list
   - terms version view
   - create/edit forms (draft/upcoming/current/deprecated lifecycle controls)
   - action controls for promote/deprecate transitions.
2. Follow existing CRUD resource conventions:
   - table action order View/Edit/Delete (where allowed),
   - permission-gated access via management-web nav/auth patterns.
3. Build forms for:
   - title/version key/content body
   - announcement/effective/enforcement timestamps
   - status transitions with server-side validation messages.
4. Add UX guardrails:
   - block creation/promotion that would violate “one upcoming” rule.
   - block transitions that would leave no single `current` version.
   - ensure old terms become `deprecated` after grace completion flow.
5. Wire management-web to management-api request helpers and typed responses.
6. Remove/avoid legacy status labels and old transition vocabulary in admin UI (hard break).

## Verification

- E2E (management-web):
  - create upcoming terms version succeeds when no upcoming exists.
  - creating second upcoming terms version is blocked with clear error.
  - promotion flow updates list/detail state correctly (`upcoming` -> `current`, prior `current` -> `deprecated`).
  - permission matrix covers allowed/forbidden admin actions.
