# Canonical secret generators + AUTH_JWT_SECRET

**Started:** 2026-05-02  
**Author:** Cursor Agent  
**Context:** Implement plan for Metaboost JWT env parity (`AUTH_JWT_SECRET`), monorepo SOPS secret generators, docs, and metaboost.cc sync.

---

### Session 1 - 2026-05-02

#### Prompt (Developer)

implement

#### Key Decisions

- **`API_JWT_SECRET` → `AUTH_JWT_SECRET`** for apps/api; **`MANAGEMENT_API_JWT_SECRET` → `AUTH_JWT_SECRET`** for management-api (independent values per env file / Kubernetes Secret).
- **`infra/k8s/scripts/secret-generators/`** holds canonical generators (copied from prior metaboost.cc scripts, plus **`create_mailer_secret.sh`**, **`create_all_secrets_auto_gen.sh`**, **`INFRA-K8S-SCRIPTS-SECRET-GENERATORS.md`**).
- **`scripts/infra/k3d/create-local-secrets.sh`**: Valkey secret name **`metaboost-keyvaldb-secrets`** (matches deployments); removed unused web sidecar secret applies.
- **`metaboost.cc/scripts/secret-generators/`** synced from the monorepo; README updated; unused web runtime token generators removed from the synced set.

#### Files Created/Modified

- `apps/api/src/config/index.ts`, `apps/management-api/src/config/index.ts`
- `apps/api/src/lib/startup/validation.ts`, `apps/management-api/src/lib/startup/validation.ts`
- `apps/api/.env.example`, `apps/management-api/.env.example`
- `infra/config/env-templates/api.env.example`, `infra/config/env-templates/management-api.env.example`
- `scripts/local-env/setup.sh`, `scripts/infra/k3d/create-local-secrets.sh`
- `.github/workflows/ci.yml`
- `apps/api/src/test/setup.ts`, `apps/api/src/test/startup-validation-auth-mode.test.ts`
- `apps/management-api/src/test/setup.ts`, `apps/management-api/src/test/startup-validation-auth-mode.test.ts`
- `apps/web/playwright.e2e-server-env.ts`, `apps/management-web/playwright.config.ts`
- `docs/development/env/ENV-VARS-CATALOG.md`, `ENV-VARS-REFERENCE.md`, `ENV-REFERENCE.md`, `LOCAL-ENV-OVERRIDES.md`
- `docs/development/security/SECURITY-REVIEW-CHECKLIST.md`
- `docs/development/k8s/REMOTE-K8S-GITOPS.md`
- `README.md`, `infra/k8s/INFRA-K8S.md`
- `infra/k8s/scripts/secret-generators/*` (new tree)
- `metaboost.cc/scripts/secret-generators/*`, `metaboost.cc/scripts/secret-generators/README.md`
