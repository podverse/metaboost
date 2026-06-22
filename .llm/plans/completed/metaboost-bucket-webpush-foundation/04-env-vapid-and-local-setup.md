# 04 - Env, VAPID, and Local Setup (Metaboost)

## Scope

- Add env surfaces for API and web runtime.
- Add VAPID key generation workflow.
- Integrate with local setup and override scripts.

## Steps

1. Add API env keys.
   - WEBPUSH_ENABLED
   - WEBPUSH_VAPID_PUBLIC_KEY
   - WEBPUSH_VAPID_PRIVATE_KEY
   - WEBPUSH_VAPID_SUBJECT
2. Add web runtime config key(s) via sidecar.
   - NEXT_PUBLIC_WEBPUSH_VAPID_PUBLIC_KEY
   - optional NEXT_PUBLIC_WEBPUSH_ENABLED if feature-gating in UI
3. Update runtime config typing, sidecar validation, and web config accessors.
4. Add VAPID generation script and invocation docs.
   - Script should generate key pair and print/export values for local env consumption.
5. Update local env setup/override flow.
   - Add notifications override file to home override stub generation/link flow.
   - Ensure local_env_setup can preserve provided VAPID values.
6. Update env examples and docs.

## Key files

- apps/api/.env.example
- apps/web/sidecar/.env.example
- apps/web/src/config/runtime-config.ts
- apps/web/sidecar/src/server.ts
- scripts/local-env/setup.sh
- scripts/env-overrides/home-override-env-files.inc.sh
- scripts/env-overrides/write-home-override-stubs.rb
- docs/development/env/LOCAL-ENV-OVERRIDES.md

## Exit criteria

- API and web runtime expose required Web Push config.
- VAPID key generation is documented and script-backed.
- local_env_prepare/link/setup flows support notification env values.