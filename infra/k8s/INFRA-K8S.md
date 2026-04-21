# Kubernetes (k3d/k3s + ArgoCD)

This directory contains a GitOps-style scaffold for Metaboost:

- `base/` for reusable manifests (see **[INFRA-K8S-BASE.md](INFRA-K8S-BASE.md)** for per-component
  remote Kustomize bases under `base/api`, `base/web`, …),
- `local/` for localhost deployment overlays,
- `alpha/` as a docs-only remote-env scaffold (no Argo `Application` tree here),
- root Argo CD manifests for **local** bootstrap only (`argocd-project.yaml`, `local-application.yaml`).

## Local first

Local deployment is intentionally self-contained and does not depend on ansible:

- env/secrets source: `make local_env_setup` and `infra/config/local/*.env`,
- cluster runtime: `k3d` (k3s-in-docker),
- controller: ArgoCD,
- fallback apply: `kubectl apply -k infra/k8s/local/stack` for immediate local bring-up.

## Per-component `base/*` vs local `base/stack`

- **`infra/k8s/base/<component>/`** (api, web, db, …) — Kustomize bases consumed by **remote** GitOps
  overlays via `resources:` URLs (see [REMOTE-K8S-GITOPS.md](../../docs/development/REMOTE-K8S-GITOPS.md)).
  These directories are the shared Deployment/Service shapes for each app.

- **`infra/k8s/base/stack/`** — Composed stack used by **local** k3d: includes Postgres init
  ConfigMap generation, wiring between components, and paths tuned for `infra/k8s/local/stack`.
  **Option B (deferred):** refactoring local k3d to compose only from per-component `base/<component>/`
  (instead of `base/stack`) is out of scope until remote thin overlays are stable; see plan set
  **metaboost-k8s-gitops-alignment** under `.llm/plans/completed/`.

## Base stack and postgres-init SQL

Canonical postgres-init source is **`base/db/postgres-init/`**. The base stack references canonical SQL
from there while keeping stack-specific wrappers as needed. Files use a **`0001_`–`0007_` prefix** so
lexicographic order matches bootstrap phase:

| File                                    | Role                                                                                                   |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **`0001_create_app_db_users.sh`**       | App read/RW roles + default privileges on app DB                                                       |
| **`0002_setup_management_database.sh`** | Management database + management roles                                                                 |
| **`0003_app_schema.sql`**               | Canonical app schema SQL → **`POSTGRES_DB`** (official image runs `*.sql` only against that DB)        |
| **`0004_load_management_schema.sh`**    | Runs **`psql -f`** **`0005_management_schema.sql.frag`** into **`DB_MANAGEMENT_NAME`**                 |
| **`0005_management_schema.sql.frag`**   | Canonical management schema SQL; **not** a `*.sql` suffix the entrypoint executes (consumed by `0004`) |
| **`0006_management_grants.sh`**         | GRANTs on management DB after tables exist                                                             |
| **`0007_default_terms_version.sql`**    | Inserts one **`active`** `terms_version` row so the API can enforce terms policy on boot               |

**Numbering note:** `postgres-init/` `000n_` names are init phase order (canonical bootstrap through default terms). SQL is maintained directly under `base/db/postgres-init/`; `scripts/database/combine-migrations.sh` validates canonical SQL presence and syncs stack shell wrappers only. To verify canonical files and detect legacy SQL sources, run **`make check_k8s_postgres_init_sync`** (includes **`scripts/database/verify-migrations-combined.sh`**).

**Docker-only:** local Compose additionally mounts **`0008_seed_local_user.sql`** (not included in K8s ConfigMaps).

## Non-local (remote cluster + GitOps)

Remote deployment uses **your** GitOps repository (Kustomize overlays, Argo CD `Application` CRs, encrypted secrets). This repo supplies classification, `make alpha_env_render`, and `METABOOST_K8S_OUTPUT_REPO`. Clean-slate steps (tooling, render, SOPS, registry pull secrets, sync order, super-admin bootstrap) are in **[`docs/development/REMOTE-K8S-GITOPS.md`](../../docs/development/REMOTE-K8S-GITOPS.md)**.

For `alpha`, `beta`, and `prod`, **`make alpha_env_render`** (with **`METABOOST_K8S_OUTPUT_REPO`**
pointing at your GitOps clone) **writes** ConfigMaps, Secret patches, and port/ingress patches **into
that GitOps repo**. Argo CD reads the GitOps repo, not the Metaboost tree. Encrypted secrets are
committed in the GitOps repo, not under `infra/k8s/` here. Canonical Argo **`Application`** CRs
live in the GitOps repo; see [ARGOCD-GITOPS-METABOOST.md](../../docs/development/ARGOCD-GITOPS-METABOOST.md).

## Main files

- `argocd-project.yaml` - shared ArgoCD AppProject.
- `local-application.yaml` - root local app-of-apps.
- `argocd/metaboost-local-stack-application.yaml` - Argo CD Application for the local stack (applied from disk in bootstrap; manual sync).
- `local/apps/` - optional manifests synced by parent Application `metaboost-local` when you Sync (includes a placeholder ConfigMap so the path is non-empty).
- Non-local SOPS-encrypted Secret manifests are **not** stored under this repo; they live in the GitOps output repository. Render cleartext with [`docs/development/K8S-ENV-RENDER.md`](../../docs/development/K8S-ENV-RENDER.md) (`make alpha_env_render` with `METABOOST_K8S_OUTPUT_REPO`), then encrypt with SOPS and commit in that repo under `secrets/metaboost-<env>/`.
