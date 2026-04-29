# Kubernetes (k3d/k3s + ArgoCD)

This directory contains a GitOps-style scaffold for Metaboost:

- `base/` for reusable manifests (see **[INFRA-K8S-BASE.md](INFRA-K8S-BASE.md)** for per-component
  remote Kustomize bases under `base/api`, `base/web`, …),
- `local/` for localhost deployment overlays,
- `alpha/` as an in-repo alpha app-of-apps source,
- root Argo CD manifests for **local** bootstrap only (`argocd-project.yaml`, `local-application.yaml`).

## Local first

Local deployment is intentionally self-contained and does not depend on ansible:

- env/secrets source: `make local_env_setup` and `infra/config/local/*.env`,
- cluster runtime: `k3d` (k3s-in-docker),
- controller: ArgoCD,
- fallback apply: `kubectl apply -k infra/k8s/local/stack` for immediate local bring-up.

## Per-component `base/*` vs local `base/stack`

- **`infra/k8s/base/<component>/`** (api, web, db, …) — Kustomize bases consumed by **remote** GitOps
  overlays via `resources:` URLs (see [REMOTE-K8S-GITOPS.md](../../docs/development/k8s/REMOTE-K8S-GITOPS.md)).
  These directories are the shared Deployment/Service shapes for each app.

- **`infra/k8s/base/stack/`** — Composed stack used by **local** k3d: includes Postgres init
  ConfigMap generation, wiring between components, and paths tuned for `infra/k8s/local/stack`.
  **Option B (deferred):** refactoring local k3d to compose only from per-component `base/<component>/`
  (instead of `base/stack`) is out of scope until remote thin overlays are stable; see plan set
  **metaboost-k8s-gitops-alignment** under `.llm/plans/completed/`.

## Base stack and source SQL

Canonical paths are **`base/db/source/`** (bootstrap under **`bootstrap/`**, plus **`app/`** and **`management/`** mirrors used by manual §4 flows). **K8s ConfigMaps** (`infra/k8s/base/db` and **`base/stack`**) embed **`bootstrap/`** files whose **`0001_`…`0006_` names** sort into init order:

| File                                         | Role                                                                                          |
| -------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **`0001_create_app_db_users.sh`**            | App read/RW roles + default privileges on app DB                                              |
| **`0002_setup_management_database.sh`**      | Management database + management roles                                                        |
| **`0003_linear_baseline.sql.gz`**            | Generated full schema snapshot (both DBs); do not hand-edit — `make db_regen_linear_baseline` |
| **`0004_seed_linear_migration_history.sql`** | Generated seed so ops migration jobs skip DDL already in **`0003`**                           |
| **`0006_management_grants.sh`**              | GRANTs on management DB after tables exist                                                    |

Forward-only sources of truth for schema evolution live under **`infra/k8s/base/ops/source/database/linear-migrations/`**; regenerate **`0003`**/**`0004`** after changing those trees.

**Terms bootstrap:** the first `terms_version` + `terms_version_content` rows are **not** inserted by SQL here. When `terms_version` is empty, **api** and **management-api** create the default current terms on startup (`TermsVersionService.assertConfiguredForStartup()`).

For forward-only migration validation and ordering checks, run **`make check_k8s_postgres_init_sync`** (uses **`scripts/database/validate-linear-migrations.sh`**).

**Docker Compose:** mounts the same **`0001`…`0006`** bootstrap files as K8s init order. The dev-only **`0008_seed_local_user.sql`** is mounted read-only at **`/opt/database/seed-scripts/local-dev-account.sql`** (not under **`docker-entrypoint-initdb.d/`**) and is applied by **`make local_db_init`** after linear migrations, so init runs only after the baseline schema exists.

## Non-local (remote cluster + GitOps)

Remote deployment uses **your** GitOps repository (Kustomize overlays, Argo CD `Application` CRs,
and encrypted secrets). This monorepo no longer renders or validates GitOps env/manifests for
remote environments. Argo CD reads the GitOps repository, not this tree. Canonical Argo
**`Application`** CRs for your cluster live in that GitOps repository; see
[ARGOCD-GITOPS-METABOOST.md](../../docs/development/k8s/ARGOCD-GITOPS-METABOOST.md) and
[REMOTE-K8S-GITOPS.md](../../docs/development/k8s/REMOTE-K8S-GITOPS.md).

## Main files

- `argocd-project.yaml` - shared ArgoCD AppProject.
- `local-application.yaml` - root local app-of-apps.
- `argocd/metaboost-local-stack-application.yaml` - Argo CD Application for the local stack (applied from disk in bootstrap; manual sync).
- `local/apps/` - optional manifests synced by parent Application `metaboost-local` when you Sync (includes a placeholder ConfigMap so the path is non-empty).
- `alpha-application.yaml` - root alpha app-of-apps Application.
- `alpha/apps/` - child alpha Application manifests (api, web, management-api, management-web, db, keyvaldb, common, ops).
- `alpha/<component>/` - in-repo alpha child app source paths referencing remote `base/<component>` URLs (`resources:` with `?ref=`), pinned to immutable revisions (commit SHA or tag) in committed manifests.
- Non-local SOPS-encrypted Secret manifests are **not** stored under this repo; they live in your GitOps repository and are maintained there.

## Revision policy

- Alpha app-of-apps and alpha child Application manifests (`infra/k8s/alpha-application.yaml`, `infra/k8s/alpha/apps/*`) use immutable Git revisions in committed manifests.
- Alpha child overlays that use remote `resources:` URLs pin immutable Git revisions in committed manifests.
- Alpha `ops` currently composes from in-repo `../../base/ops` because `infra/k8s/base/ops` is not published on the public remote refs consumed by Kustomize.
- Local-only Argo Application manifests (`infra/k8s/local-application.yaml`, `infra/k8s/argocd/metaboost-local-stack-application.yaml`) may use `targetRevision: staging` for local iteration and manual sync workflows.
