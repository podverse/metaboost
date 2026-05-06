# helpers-subpath-export-trim

**Started:** 2026-05-06  
**Author:** Cursor Agent  
**Context:** Drop redundant `@metaboost/helpers` package subpath export; use root barrel only.

---

### Session 1 - 2026-05-06

#### Prompt (Developer)

Remove redundant `@metaboost/helpers` subpath export

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- ORM now imports `DEFAULT_FREE_TRIAL_EXPIRATION` from `@metaboost/helpers` (root export already provided by `index.ts`).
- Removed `./membership/productMembershipDefaultsFromEnv.js` from `packages/helpers/package.json` `exports`; subpath map retains only `"."`.

#### Files Created/Modified

- `packages/orm/src/lib/freeTrialExpirationSeconds.ts`
- `packages/helpers/package.json`
- `.llm/history/active/helpers-subpath-export-trim/helpers-subpath-export-trim-part-01.md`
