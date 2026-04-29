# 05 - Metaboost Registry Default Config

## Scope

Make Metaboost default to Podverse Metaboost Registry repo for app public keys, while allowing runtime override through environment variables.

## Outcomes

- Default registry URL is preconfigured in Metaboost env/template contract.
- Operators can switch registry source without code changes.
- Startup validation ensures safe config values.

## Steps

1. Add new API config fields in:
   - [`/Users/mitcheldowney/repos/pv/metaboost/apps/api/src/config/index.ts`](file:///Users/mitcheldowney/repos/pv/metaboost/apps/api/src/config/index.ts)
2. Add startup validation in:
   - [`/Users/mitcheldowney/repos/pv/metaboost/apps/api/src/lib/startup/validation.ts`](file:///Users/mitcheldowney/repos/pv/metaboost/apps/api/src/lib/startup/validation.ts)
3. Add env template contract defaults and docs:
   - [`/Users/mitcheldowney/repos/pv/metaboost/infra/env/template contract/`](file:///Users/mitcheldowney/repos/pv/metaboost/infra/env/template contract/)
   - [`/Users/mitcheldowney/repos/pv/metaboost/docs/development/ENV-REFERENCE.md`](file:///Users/mitcheldowney/repos/pv/metaboost/docs/development/ENV-REFERENCE.md)
4. Define default registry URL value to exact Podverse raw endpoint:
   - `https://raw.githubusercontent.com/v4v-io/metaboost-registry/main/registry/apps`
   - lookup convention: `<base>/<app_id>.app.json`.
5. Add override env vars, for example:
   - `STANDARD_ENDPOINT_REGISTRY_URL`
   - `STANDARD_ENDPOINT_REGISTRY_POLL_SECONDS`
   - `STANDARD_ENDPOINT_REGISTRY_TIMEOUT_MS`
6. Add unit/config tests for default and override behavior.

## Default Policy

- If `STANDARD_ENDPOINT_REGISTRY_URL` is not set, use:
  - `https://raw.githubusercontent.com/v4v-io/metaboost-registry/main/registry/apps`
- If set, validate URL shape and use override.
- Log effective registry host on startup (without leaking credentials).

## Key Files

- [`/Users/mitcheldowney/repos/pv/metaboost/apps/api/src/config/index.ts`](file:///Users/mitcheldowney/repos/pv/metaboost/apps/api/src/config/index.ts)
- [`/Users/mitcheldowney/repos/pv/metaboost/apps/api/src/lib/startup/validation.ts`](file:///Users/mitcheldowney/repos/pv/metaboost/apps/api/src/lib/startup/validation.ts)
- [`/Users/mitcheldowney/repos/pv/metaboost/infra/env/template contract/base.yaml`](file:///Users/mitcheldowney/repos/pv/metaboost/infra/env/template contract/base.yaml)
- [`/Users/mitcheldowney/repos/pv/metaboost/docs/development/ENV-REFERENCE.md`](file:///Users/mitcheldowney/repos/pv/metaboost/docs/development/ENV-REFERENCE.md)

## Verification

- API starts with no explicit registry env and uses default URL.
- API starts with override URL and uses override.
- Invalid override fails startup with clear message.
