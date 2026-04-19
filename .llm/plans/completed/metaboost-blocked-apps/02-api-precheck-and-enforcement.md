# Phase 2: API pre-check and enforcement

- Added app blocking policy helper:
  - evaluates registry status, global override, and bucket block state.
- Added app block scope helper for root-bucket inheritance checks.
- Updated AppAssertion flow:
  - verified app id (`iss`) is stored on `req.appAssertionAppId`.
- Updated `mb-v1` and `mbrss-v1`:
  - unsigned GET pre-check supports `app_id` and returns app-allowed fields.
  - POST enforces app policy and returns 403 with deterministic reason code.
- Added bucket routes/controllers for:
  - blocked-app CRUD
  - registry app list with global-status flags.
