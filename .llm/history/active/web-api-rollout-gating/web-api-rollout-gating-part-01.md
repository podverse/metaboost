# web-api-rollout-gating

## Started

2026-05-03

## Context

Strengthen rollout contract so web and management-web wait for API and management-api release identity, not only stable version path, during rollout/migration transitions.

### Session 1 - 2026-05-03

#### Prompt (Developer)

Stronger web ↔ API rollout gating

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

you stalled. continue

#### Key Decisions

- Added required `API_RELEASE` / `MANAGEMENT_API_RELEASE` env contracts to config/startup validation and surfaced them through `/meta` in API and management-api.
- Updated web and management-web init-container contract checks to require both `version` and `release` fields from API `/meta`.
- Added K8s base env defaults and app/env template entries for new release keys.
- Added Argo sync-wave ordering annotations to monorepo alpha Application manifests (`common` -> `db/keyvaldb` -> `ops` -> `api/management-api` -> `web/management-web`).

#### Files Modified

- `apps/api/src/config/index.ts`
- `apps/api/src/app.ts`
- `apps/api/src/lib/startup/validation.ts`
- `apps/api/src/test/root-routes.test.ts`
- `apps/api/src/test/setup.ts`
- `apps/api/.env.example`
- `apps/management-api/src/config/index.ts`
- `apps/management-api/src/app.ts`
- `apps/management-api/src/lib/startup/validation.ts`
- `apps/management-api/src/test/root-routes.test.ts`
- `apps/management-api/src/test/setup.ts`
- `apps/management-api/.env.example`
- `infra/config/env-templates/api.env.example`
- `infra/config/env-templates/management-api.env.example`
- `infra/k8s/base/api/source/api.env`
- `infra/k8s/base/management-api/source/management-api.env`
- `infra/k8s/base/web/deployment.yaml`
- `infra/k8s/base/management-web/deployment.yaml`
- `infra/k8s/base/web/source/web-sidecar.env`
- `infra/k8s/base/management-web/source/management-web-sidecar.env`
- `infra/k8s/alpha/apps/common.yaml`
- `infra/k8s/alpha/apps/db.yaml`
- `infra/k8s/alpha/apps/keyvaldb.yaml`
- `infra/k8s/alpha/apps/ops.yaml`
- `infra/k8s/alpha/apps/api.yaml`
- `infra/k8s/alpha/apps/management-api.yaml`
- `infra/k8s/alpha/apps/web.yaml`
- `infra/k8s/alpha/apps/management-web.yaml`

### Session 2 - 2026-05-03

#### Prompt (Developer)

across all example files and base env files use this as an example version

X.X.X-staging.N

#### Key Decisions

- Standardized placeholder release strings in app `.env.example`, `infra/config/env-templates/*.env.example`, and `infra/k8s/base/**/source/*.env` to literal `X.X.X-staging.N`.
- Left GitOps live alpha env pins unchanged so they continue to match real `?ref=` / image tags for CI.

#### Files Modified

- `apps/api/.env.example`
- `apps/management-api/.env.example`
- `infra/config/env-templates/api.env.example`
- `infra/config/env-templates/management-api.env.example`
- `infra/k8s/base/api/source/api.env`
- `infra/k8s/base/management-api/source/management-api.env`
- `infra/k8s/base/web/source/web-sidecar.env`
- `infra/k8s/base/management-web/source/management-web-sidecar.env`
