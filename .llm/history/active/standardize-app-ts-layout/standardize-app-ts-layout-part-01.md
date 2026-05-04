# standardize-app-ts-layout

**Started:** 2026-05-03  
**Author:** Agent  
**Context:** Align Express `app.ts` layout with Podverse (comments + structure); import hygiene in health helper.

---

### Session 1 - 2026-05-03

#### Prompt (Developer)

Standardize `app.ts` layout (Podverse + Metaboost)

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Metaboost API + management-api `app.ts`: merged Express type imports into one line; added `// ---` section banners aligned with Podverse conventions.
- `registerHealthRoutes.ts` (api + management-api): `import type` from `express` before internal `@metaboost/*` imports for `perfectionist/sort-imports`; management-api orders `management-orm` before `orm`.
- Root `npm run lint` still fails Prettier on unrelated `.cursor/skills/migration-readiness-marker-sync/SKILL.md`; `eslint apps/api/src apps/management-api/src` passes; `npm run test:e2e:api` passes.

#### Files Created/Modified

- apps/api/src/app.ts
- apps/api/src/lib/health/registerHealthRoutes.ts
- apps/management-api/src/app.ts
- apps/management-api/src/lib/health/registerHealthRoutes.ts
