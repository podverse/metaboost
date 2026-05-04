# api-error-console-debug-gate

**Started:** 2026-05-03  
**Author:** Agent  
**Context:** Gate Express error-handler `console.error` on `LOG_LEVEL=debug`.

---

### Session 1 - 2026-05-03

#### Prompt (Developer)

@podverse/apps/management-api/src/app.ts:80-86 look in each of the apis and mgmt apis. if log level = debug, then the console.error should happen. it should not happen if log level is below debug

#### Key Decisions

- Metaboost API `app.ts`: `isDebugLogLevel()` matches Valkey startup helper pattern; wrap unhandled error `console.error`.
- Metaboost management-api `app.ts`: same helper; unhandled errors log to stderr only when `LOG_LEVEL` is debug.

#### Files Created/Modified

- apps/api/src/app.ts
- apps/management-api/src/app.ts
