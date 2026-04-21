# Phase 2 - Policy Evaluator and Auth API

## Scope

Build a single policy evaluator and expose terms policy state through auth APIs.

## Steps

1. Add API policy library in
   `/Users/mitcheldowney/repos/pv/metaboost/apps/api/src/lib/terms-policy/`:
   - resolve active terms version
   - compute phase from `announcement_starts_at`, `effective_at`, `enforcement_starts_at`
   - compute user state (`acceptedCurrent`, `mustAcceptNow`, optional warning text)
2. Define explicit phase enum:
   - `pre_announcement`
   - `announcement`
   - `grace`
   - `enforced`
3. Update auth serialization and payloads (`login`, `refresh`, `me`) to include:
   - `currentVersionKey`
   - `phase`
   - `acceptedCurrent`
   - `mustAcceptNow`
   - optional user-facing blocker message when acceptance is required.
4. Update acceptance endpoint:
   - `PATCH /auth/terms-acceptance` records acceptance for current active version
   - return updated user + policy state.
5. Keep delete endpoint behavior compatible:
   - `DELETE /auth/me` stays available from terms-required page path.
6. Remove dependency on env-driven latest terms dates for runtime policy decisions.

## Key Files

- `/Users/mitcheldowney/repos/pv/metaboost/apps/api/src/controllers/authController.ts`
- `/Users/mitcheldowney/repos/pv/metaboost/apps/api/src/routes/auth.ts`
- `/Users/mitcheldowney/repos/pv/metaboost/apps/api/src/schemas/auth.ts`
- `/Users/mitcheldowney/repos/pv/metaboost/apps/api/src/lib/userToJson.ts`
- `/Users/mitcheldowney/repos/pv/metaboost/apps/api/src/lib/terms-policy/` (new)

## Verification

- Integration tests assert policy fields exist and match seeded terms version windows.
- Acceptance endpoint is idempotent for already-accepted current version.
- Auth responses remain credential-safe.
