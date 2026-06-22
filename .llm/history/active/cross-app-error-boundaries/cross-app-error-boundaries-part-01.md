# cross-app-error-boundaries

**Started:** 2026-05-06  
**Author:** Agent  
**Context:** Align Next.js error routes with Podverse-style handling for Metaboost web and management-web.

### Session 1 - 2026-05-06

#### Prompt (Developer)

Align error boundary handling (Podverse + Metaboost)

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the todo's.

#### Key Decisions

- Added `apps/web` and `apps/management-web` `error.tsx` and `global-error.tsx` with `@metaboost/ui`, dynamic locale loading for `global-error`, and `ThemeWrapper` + `globals.scss` on global shell (web: `web-settings`, management: `management-settings` cookie).
- Extended `errors` in `i18n/originals/en-US.json` and `es.json` for both apps with boundary/global/action strings.
- Skipped optional subtree `ErrorBoundary` until an isolation use case exists.

#### Files Created/Modified

- apps/web/src/app/error.tsx
- apps/web/src/app/global-error.tsx
- apps/web/i18n/originals/en-US.json, es.json
- apps/management-web/src/app/error.tsx
- apps/management-web/src/app/global-error.tsx
- apps/management-web/i18n/originals/en-US.json, es.json
