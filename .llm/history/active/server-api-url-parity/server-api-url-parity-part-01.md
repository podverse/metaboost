# server-api-url-parity

## Context

Podverse-style wiring: internal API base URLs for Next SSR come from runtime-config (sidecar ConfigMap), not duplicate literals on web Deployments.

---

### Session 1 - 2026-05-01

#### Prompt (Developer)

Podverse vs Metaboost: server API base URL wiring

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Removed redundant `API_SERVER_BASE_URL` / `MANAGEMENT_API_SERVER_BASE_URL` from remote K8s Deployment manifests and local stack `workloads.yaml`; cluster values remain on `*-sidecar.env` → runtime-config JSON.
- Updated `remote-k8s.yaml` header comment, ENV-VARS docs (sidecar sections), and `getServer*BaseUrl` JSDoc to match (process.env for Playwright/E2E; runtime-config for K8s).
- Did **not** remove `process.env`-first behavior in TS (plan recommendation: optional full parity deferred).

#### Files Created/Modified

- `infra/k8s/base/web/deployment-web.yaml`
- `infra/k8s/base/web/deployment-web-sidecar.yaml`
- `infra/k8s/base/management-web/deployment-management-web.yaml`
- `infra/k8s/base/stack/workloads.yaml`
- `infra/env/overrides/remote-k8s.yaml`
- `apps/web/src/config/env.ts`
- `apps/management-web/src/config/env.ts`
- `docs/development/env/ENV-VARS-REFERENCE.md`
- `docs/development/env/ENV-VARS-CATALOG.md`
- `.llm/history/active/server-api-url-parity/server-api-url-parity-part-01.md`
