### Session 1 - 2026-05-02

#### Prompt (Developer)

metaboost should have similar handling as podverse in terms for file separation and helpers for
the health check route and keyvaldb stuff

#### Key Decisions

- Align Metaboost API and management-api health-ready routing with Podverse-style helper
  separation.
- Keep behavior unchanged while extracting route registration and valkey check logic into
  dedicated helper files.
- Added per-app `testValkeyConnection` helpers so readiness routes call local valkey helpers
  instead of directly embedding ping logic in app factories.

#### Files Modified

- `apps/api/src/app.ts`
- `apps/api/src/lib/health/registerHealthReadyRoute.ts`
- `apps/api/src/lib/valkey/testValkeyConnection.ts`
- `apps/management-api/src/app.ts`
- `apps/management-api/src/lib/health/registerHealthReadyRoute.ts`
- `apps/management-api/src/lib/valkey/testValkeyConnection.ts`
- `.llm/history/active/metaboost-health-valkey-helper-parity/metaboost-health-valkey-helper-parity-part-01.md`
