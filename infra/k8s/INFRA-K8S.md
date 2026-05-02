# Kubernetes (bases + alpha app-of-apps)

This directory contains a GitOps-style scaffold for Metaboost:

- **`base/`** for reusable manifests (see **[INFRA-K8S-BASE.md](INFRA-K8S-BASE.md)** for per-component remote Kustomize bases under `base/api`, `base/web`, …),
- **`alpha/`** as an in-repo alpha app-of-apps source (child Applications reference remote `base/*` URLs with pinned revisions).

## Local development

Day-to-day development uses **Docker Compose** and host-run apps (`make local_infra_up`, `npm run dev:*`). See [docs/QUICKSTART.md](../../docs/QUICKSTART.md) and [infra/INFRA.md](../INFRA.md).

Cluster-shaped validation uses a **remote** cluster and your **GitOps** repository; see [REMOTE-K8S-GITOPS.md](../../docs/development/k8s/REMOTE-K8S-GITOPS.md).

## Per-component `base/*`

- **`infra/k8s/base/<component>/`** (api, web, db, keyvaldb, …) — Kustomize bases consumed by remote GitOps overlays via `resources:` URLs (see [REMOTE-K8S-GITOPS.md](../../docs/development/k8s/REMOTE-K8S-GITOPS.md)) and referenced by in-repo **`infra/k8s/alpha/<component>/`** kustomizations.

## Base DB source SQL

Canonical paths are **`base/db/source/`** (bootstrap under **`bootstrap/`**, plus **`app/`** and **`management/`** mirrors used by manual §4 flows). **K8s ConfigMaps** from **`infra/k8s/base/db`** embed **`bootstrap/`** files whose **`0001_`…`0006_` names** sort into init order:

| File                                                                 | Role                                                                                                        |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **`0001_create_app_db_users.sh`**                                    | App owner/migrator/read-write/read role setup + default privileges on app DB                                |
| **`0002_setup_management_database.sh`**                              | Management owner/migrator/read-write/read role setup + grants                                               |
| **`0003_apply_linear_baselines.sh`** / **`0003a_*`** / **`0003b_*`** | Apply app vs management baselines as each DB migrator; gz files generated — `make db_regen_linear_baseline` |

Forward-only sources of truth for schema evolution live under **`infra/k8s/base/ops/source/database/linear-migrations/`**; regenerate **`0003a`**/**`0003b`** after changing those trees.

**Terms bootstrap:** the first `terms_version` + `terms_version_content` rows are **not** inserted by SQL here. When `terms_version` is empty, **api** and **management-api** create the default current terms on startup (`TermsVersionService.assertConfiguredForStartup()`).

For forward-only migration validation and ordering checks, run **`make check_k8s_postgres_init_sync`** (uses **`scripts/database/validate-linear-migrations.sh`**).

**Docker Compose:** mounts the same **`0001`…`0003b`** bootstrap files as K8s init order. The dev-only **`0008_seed_local_user.sql`** is mounted read-only at **`/opt/database/seed-scripts/local-dev-account.sql`** (not under **`docker-entrypoint-initdb.d/`**) and is applied by **`make local_db_init`** after linear migrations, so init runs only after the baseline schema exists.

## Remote cluster + GitOps

Remote deployment uses **your** GitOps repository (Kustomize overlays, Argo CD `Application` CRs, and encrypted secrets). Argo CD reads the GitOps repository for deployed environments. Canonical Argo **`Application`** CRs for your cluster live in that GitOps repository; see [ARGOCD-GITOPS-METABOOST.md](../../docs/development/k8s/ARGOCD-GITOPS-METABOOST.md) and [REMOTE-K8S-GITOPS.md](../../docs/development/k8s/REMOTE-K8S-GITOPS.md).

## Main files

- **`argocd-project.yaml`** — optional shared Argo CD `AppProject` you may apply when bootstrapping Argo CD against this repo’s conventions (child apps usually live in GitOps).
- **`alpha-application.yaml`** — root alpha app-of-apps `Application`.
- **`alpha/apps/`** — child alpha `Application` manifests (api, web, management-api, management-web, db, keyvaldb, common, ops).
- **`alpha/<component>/`** — in-repo alpha child app source paths referencing remote `base/<component>` URLs (`resources:` with `?ref=`), pinned to immutable revisions (commit SHA or tag) in committed manifests.
- Non-local SOPS-encrypted Secret manifests are **not** stored under this repo; they live in your GitOps repository and are maintained there.
- **Secret generator scripts** (JWT, DB, Valkey, mailer, GHCR): **[`infra/k8s/scripts/secret-generators/INFRA-K8S-SCRIPTS-SECRET-GENERATORS.md`](scripts/secret-generators/INFRA-K8S-SCRIPTS-SECRET-GENERATORS.md)**.

## Revision policy

- Alpha app-of-apps and alpha child Application manifests (`infra/k8s/alpha-application.yaml`, `infra/k8s/alpha/apps/*`) use immutable Git revisions in committed manifests.
- Alpha child overlays that use remote `resources:` URLs pin immutable Git revisions in committed manifests.
- Alpha **`ops`** currently composes from in-repo **`../../base/ops`** because **`infra/k8s/base/ops`** is not published on the public remote refs consumed by Kustomize.
