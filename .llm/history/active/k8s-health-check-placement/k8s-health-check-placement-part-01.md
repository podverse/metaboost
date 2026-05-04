# k8s-health-check-placement

## Started

2026-05-02

### Session 1 - 2026-05-02

#### Prompt (Developer)

Kubernetes health checks: base vs alpha vs patches

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Documented in `infra/k8s/alpha/api/kustomization.yaml` that Metaboost base API already includes TCP waits, migration init, and `/v1/health/ready`.

#### Files Created/Modified

- `infra/k8s/alpha/api/kustomization.yaml`

### Session 2 - 2026-05-03

#### Prompt (Developer)

i need you to make sure that k8s deploys use readiness checks to make sure pods only go live after required conditions are met. ask me questions if you are unsure about any of this.

podverse:

i think podverse-alpha-common is required for all of these jobs to work (maybe?), but i'm not sure readiness checks involving podverse-alpha-common can be done. if we need env vars or patches to help the k8s know which versions or migrations they should expect then include that.

podverse-alpha-db - i'm not sure any readiness checks are needed

podverse-alpha-ops - confirm the database is up-to-date with whatever db migrations need to have run for jobs to succeed. if ops jobs can interact with keyvaldb and keyvaldb is enabled, this may need a check to ensure keyvaldb can be connected to.

podverse-alpha-mq - not sure any checks are needed.

podverse-alpha-keyvaldb - not sure any checks are needed.

podverse-alpha-cron - similar to podverse-alpha-ops in terms of requirements?

podverse-alpha-api - confirm database can be connected to and migrations are up-to-date. if keyvaldb is enabled confirm that keyvaldb can be connected to.

podverse-alpha-web - confirm podverse-alpha-api can be connected to AND podverse-alpha-api is on the version that web expects it to be.

podverse-alpha-management-api and podverse-alpha-management-web should have sensible readiness checks as well.

metaboost will also need sensible readiness checks. advise on how best to proceed. some of these readiness checks may already be implemented but we need to fill any gaps or misalignment you identify

#### Prompt (Developer)

do you think strict would be worthwhile? between minimal, balanced, strict, what do you recommend? we have not gone live yet so we are comfortable making dramatic changes if it puts us in a better position for the future.

#### Prompt (Developer)

you stalled during the last prompt. continue

#### Key Decisions

- Added DB-aware readiness checks for both API and management-api; management-api readiness now verifies both management and app DB reachability.
- Added `/meta` endpoints on API and management-api so web workloads can enforce version compatibility at startup.
- Hardened migration init gates to require explicit expected migration filenames from env for both API and management-api.
- Upgraded web and management-web deployments to strict initContainer API-version contract checks and HTTP-based readiness/liveness probes on app ports.
- Added integration test coverage for new `/meta` endpoints in API and management-api root route tests.

#### Files Modified

- `.llm/history/active/k8s-health-check-placement/k8s-health-check-placement-part-01.md`
- `apps/api/src/lib/health/registerHealthReadyRoute.ts`
- `apps/api/src/app.ts`
- `apps/api/src/test/root-routes.test.ts`
- `apps/management-api/src/lib/health/registerHealthReadyRoute.ts`
- `apps/management-api/src/app.ts`
- `apps/management-api/src/test/root-routes.test.ts`
- `infra/k8s/base/api/deployment.yaml`
- `infra/k8s/base/api/source/api.env`
- `infra/k8s/base/management-api/deployment.yaml`
- `infra/k8s/base/management-api/source/management-api.env`
- `infra/k8s/base/web/deployment.yaml`
- `infra/k8s/base/web/source/web-sidecar.env`
- `infra/k8s/base/management-web/deployment.yaml`
- `infra/k8s/base/management-web/source/management-web-sidecar.env`

### Session 3 - 2026-05-03

#### Prompt (Developer)

are you sure that the env vars you set align with what the latest migrations these tech stacks should expect to be? also, add skill files if needed to remind yourself to keep these defaults up to date with the latest when adding new migrations

#### Key Decisions

- Confirmed current app migration tip is `0003_terms_default_seed.sql` and management migration tip is `0001_management_schema.sql`; readiness marker env values already match current latest files.
- Added a dedicated Metaboost skill requiring marker env and initContainer readiness checks to be updated whenever new linear migrations are added.

#### Files Modified

- `.llm/history/active/k8s-health-check-placement/k8s-health-check-placement-part-01.md`
- `.cursor/skills/migration-readiness-marker-sync/SKILL.md`

### Session 4 - 2026-05-03

#### Prompt (Developer)

revise the /health and /health/ready across all podverse and metaboost apis and mgmt apis so that health checks are all in one file that is named something logical

#### Key Decisions

- Consolidated `/health` and `/health/ready` into `registerHealthRoutes.ts` for Metaboost api and management-api; removed `registerHealthReadyRoute.ts` modules.

#### Files Modified

- `.llm/history/active/k8s-health-check-placement/k8s-health-check-placement-part-01.md`
- `apps/api/src/app.ts`
- `apps/api/src/lib/health/registerHealthRoutes.ts`
- `apps/management-api/src/app.ts`
- `apps/management-api/src/lib/health/registerHealthRoutes.ts`
- `apps/api/src/lib/health/registerHealthReadyRoute.ts` (removed)
- `apps/management-api/src/lib/health/registerHealthReadyRoute.ts` (removed)

### Session 5 - 2026-05-03

#### Prompt (Developer)

Remove KeyVal TCP legacy overlay (clean forward path)

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Metaboost `infra/k8s/alpha/api/kustomization.yaml` header describes base init/probes only; removed “no separate KeyVal patch” / GitOps pointer framing.

#### Files Modified

- `.llm/history/active/k8s-health-check-placement/k8s-health-check-placement-part-01.md`
- `infra/k8s/alpha/api/kustomization.yaml`
