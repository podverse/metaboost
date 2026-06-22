# 06 — K8s Alpha + Infra + Env Triage

## Scope

This theme triages MetaBoost's infrastructure changes: the `alpha` Kustomize overlay, base K8s env
sources, env templates, and infra documentation. Focus is **ops-flow consistency** (deploy/GitOps
shape, env layout, readiness/liveness conventions), not application SQL/column patterns.

Podverse is the reference for K8s/env conventions (it has `infra-k8s`, `linear-baseline-0003`,
`startup-validation-env-order`, `extensions-env`, `env-file-formatting` rules/skills).

## Changed paths

K8s overlay (`infra/k8s/alpha/`):

- `alpha-application.yaml`, `alpha/common/kustomization.yaml`, `alpha/*/kustomization.yaml`
  (api, db, keyvaldb, management-api, management-web, ops, web)
- `alpha/apps/*.yaml` (api, common, db, keyvaldb, management-api, management-web, ops, web)

K8s base + env:

- `infra/k8s/base/api/source/api.env`,
  `infra/k8s/base/management-api/source/management-api.env`,
  `infra/k8s/base/management-web/source/management-web-sidecar.env`,
  `infra/k8s/base/web/source/web-sidecar.env`,
  `infra/k8s/base/product-membership/source/product-membership-settings.env`
- `infra/k8s/base/db/source/app/0001_app_schema.sql`,
  `infra/k8s/base/db/source/bootstrap/0003a_app_linear_baseline.sql.gz`,
  `infra/k8s/base/ops/source/database/linear-migrations/app/0001_app_schema.sql`
- `infra/config/env-templates/api.env.example`,
  `infra/config/env-templates/management-api.env.example`,
  `infra/config/env-templates/web-sidecar.env.example`

Docs:

- `infra/INFRA.md`, `infra/k8s/INFRA-K8S.md`, `infra/k8s/INFRA-K8S-BASE.md`,
  `infra/docker/local/INFRA-DOCKER-LOCAL.md`,
  `infra/k8s/scripts/secret-generators/INFRA-K8S-SCRIPTS-SECRET-GENERATORS.md`
- `docs/development/k8s/ARGOCD-GITOPS-METABOOST.md`, `docs/development/k8s/K3D-ARGOCD-LOCAL.md`,
  `docs/development/k8s/REMOTE-K8S-GITOPS.md`

## Triage method

1. For the `alpha` overlay diff (mostly small kustomization edits + readiness/liveness probes per
   recent commits), confirm changes follow Podverse's overlay conventions and the `infra-k8s` rule.
   Many edits look like probe/version alignment — classify KEEP if consistent.
2. For base + template `.env` files, apply `env-file-formatting` rules (quoting, alignment with
   `.env.example`, ordering) and confirm parity with Podverse env layout. The
   `argocd-gitops-push` skill applies: note that infra changes must be pushed to the Argo CD branch.
3. For the SQL/baseline files (`0001_app_schema.sql`, `0003a_..._baseline.sql.gz`): only verify the
   **ops flow** is consistent (the linear-baseline gz is generated, not hand-edited; per the
   `linear-baseline-gz-sync` skill it must be regenerated and committed). Do not review
   column-level schema patterns (out of scope). Flag if the gz appears hand-edited or out of sync
   with the SQL source.
4. Record any Podverse infra conventions MetaBoost lacks as PARITY-GAP rows for Plan 09.

## Expected decisions

| File group                         | Decision | Notes                                                |
| ---------------------------------- | -------- | ---------------------------------------------------- |
| `alpha/**` kustomizations + apps   | TBD      | KEEP if probe/overlay conventions match Podverse      |
| base/template `.env` files         | TBD      | ALIGN if env-file-formatting/parity issues             |
| SQL + linear-baseline gz           | TBD      | KEEP if gz regenerated from source; ALIGN if drifted   |
| infra/k8s docs                     | TBD      | ALIGN if stale paths/process                           |
| Podverse-only infra conventions    | PARITY-GAP | record for Plan 09                                   |

## Decisions

**Executed:** 2026-06-21  
**Scope note:** SQL +39 lines treated as ops-flow only (webpush-related schema); column review out of scope.

### Alpha overlay (`infra/k8s/alpha/`)

| Path / group | Decision | Notes |
| --- | --- | --- |
| `alpha/apps/*.yaml` targetRevision | **KEEP** | `X.X.X-staging.N` → `X.Y.Z-staging.N` placeholder alignment |
| `alpha/*/kustomization.yaml` remote refs | **KEEP** | Same placeholder update across overlays |
| `alpha/api` removes product-membership resource | **KEEP** | Moved to `alpha/common` — matches updated `INFRA-K8S-BASE.md` |
| `alpha/common/kustomization.yaml` adds product-membership | **KEEP** | Shared ConfigMap composition pattern; verify kustomize build in stage-2 |
| Probe/readiness changes (recent commits) | **KEEP** | No conflicting drift vs Podverse in pending diff |

### Base + template env

| Path / group | Decision | Notes |
| --- | --- | --- |
| `infra/config/env-templates/*.env.example` WEBPUSH keys | **KEEP** | Aligns with feature env; templates updated |
| `infra/k8s/base/api/source/api.env` | **ALIGN** | Missing WEBPUSH keys present in templates — sync in stage-2 |
| `infra/k8s/base/web/source/web-sidecar.env` | **ALIGN** | Add `NEXT_PUBLIC_WEBPUSH_*` to match template |
| Release placeholders in base env | **KEEP** | `X.Y.Z-staging.N` consistent with alpha apps |
| `product-membership-settings.env` comment | **KEEP** | Documents alpha/common composition |

### SQL + linear baseline (ops flow)

| Path / group | Decision | Notes |
| --- | --- | --- |
| `0001_app_schema.sql` (+39 lines, db + linear-migrations) | **KEEP** | Feature schema; ops: both paths updated together |
| `0003a_app_linear_baseline.sql.gz` | **ALIGN** | Size changed with SQL — **verify/regenerate** via linear-baseline-gz-sync workflow in stage-2 |

### Infra docs

| Path | Decision | Notes |
| --- | --- | --- |
| `INFRA-K8S-BASE.md` | **KEEP** | product-membership → alpha/common; doc link fix |
| Other infra/k8s docs (pending diff) | **KEEP** | Minor path/link updates; no export/changelog refs |

### Podverse-only (PARITY-GAP → Plan 09 / abcmemory)

| Item | Notes |
| --- | --- |
| `infra-k8s.mdc` rule | Adopt via abcmemory-align |
| Podverse `extensions-env`, workers/mq k8s bases | N/A for MetaBoost app set |

**Stage-2 spawned:** `.llm/plans/active/metaboost-infra-env-align/`

**Argo CD reminder:** stage-2 execution must push `infra/k8s/**` to GitOps branch.

## Stage-2 spawn rule

If env formatting/parity or infra-doc drift is found, create
`.llm/plans/active/metaboost-infra-env-align/`. If the linear baseline gz is out of sync, that work
belongs in a dedicated stage-2 plan referencing the `linear-baseline-gz-sync` skill. Note: any
resulting `infra/k8s/**` edits require an Argo CD branch push (see `argocd-gitops-push`).

## Verification (for the operator, later)

```bash
diff <(ls /Users/mitcheldowney/repos/pv/metaboost/infra/config/env-templates) <(ls /Users/mitcheldowney/repos/pv/podverse/infra/config/env-templates 2>/dev/null) || true
```
