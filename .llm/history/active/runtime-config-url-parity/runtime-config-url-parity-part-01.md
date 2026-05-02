# runtime-config-url-parity

## Context

Align Metaboost `RUNTIME_CONFIG_URL` handling with Podverse patterns (ConfigMap source, layout fallback, optional validate-env).

---

### Session 1 - 2026-05-01

#### Prompt (Developer)

do it

#### Key Decisions

- Moved `RUNTIME_CONFIG_URL` into K8s ConfigMap sources [`infra/k8s/base/web/source/web.env`](infra/k8s/base/web/source/web.env) and [`management-web/source/management-web.env`](infra/k8s/base/management-web/source/management-web.env); removed duplicate literals from Deployments.
- Matched Podverse root-layout behavior: fetch sidecar only when `RUNTIME_CONFIG_URL` is set; on failure use `getRuntimeConfig()` / `process.env` fallback (web + management-web).
- Added `scripts/validate-env.ts` + `tsx` + `validate-env` npm scripts for both Next apps (http(s) URL validation via `@metaboost/helpers`).
- Updated docs/skills/AGENTS/PUBLISH for the new contract.

#### Files Created/Modified

- `apps/web/scripts/validate-env.ts`
- `apps/management-web/scripts/validate-env.ts`
- `apps/web/tsconfig.scripts.json`
- `apps/management-web/tsconfig.scripts.json`
- `apps/web/package.json`
- `apps/management-web/package.json`
- `package.json`
- `package-lock.json`
- `apps/web/src/app/layout.tsx`
- `apps/management-web/src/app/layout.tsx`
- `apps/web/instrumentation.ts`
- `infra/k8s/base/web/source/web.env`
- `infra/k8s/base/management-web/source/management-web.env`
- `infra/k8s/base/web/deployment-web.yaml`
- `infra/k8s/base/management-web/deployment-management-web.yaml`
- `docs/testing/E2E-PAGE-TESTING.md`
- `docs/PUBLISH.md`
- `AGENTS.md`
- `.cursor/skills/web/SKILL.md`
- `.llm/history/active/runtime-config-url-parity/runtime-config-url-parity-part-01.md`
