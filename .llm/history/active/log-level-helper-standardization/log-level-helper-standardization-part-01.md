# log-level-helper-standardization

**Started:** 2026-05-03  
**Author:** Agent  
**Context:** Shared log-level helpers; helpers-valkey consumes `@metaboost/helpers`.

---

### Session 1 - 2026-05-03

#### Prompt (Developer)

Standardize LOG_LEVEL debug checks (Podverse + Metaboost)

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Added `packages/helpers/src/lib/logLevel.ts` (+ tests), exported from package index.
- `helpers-valkey/package.json`: workspace dependency on `@metaboost/helpers`; `pingDisposable` uses `isEnvLogLevelDebug`.
- Apps use helper in error middleware and Valkey startup wait modules.

#### Files Created/Modified

- packages/helpers/src/lib/logLevel.ts, logLevel.test.ts, src/index.ts
- packages/helpers-valkey/package.json, src/pingDisposable.ts
- apps/api/src/app.ts, apps/api/src/lib/valkey/waitForValkeyPingReady.ts
- apps/management-api/src/app.ts, apps/management-api/src/lib/valkey/waitForValkeyPingReady.ts
- package-lock.json (npm install)
