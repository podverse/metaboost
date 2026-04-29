# 01 — Canonical default `terms_version` in postgres-init (K8s + Docker)

## Scope

Make the default **active** `terms_version` row part of **canonical** DB initialization so clean **production/K8s** databases get it automatically, not only local Docker.

## Steps

### 1. Canonical SQL

- Add **`infra/k8s/base/db/postgres-init/0007_default_terms_version.sql`** (new file).
- Content: move/adapt the `INSERT` from existing [`0008_seed_local_terms_version.sql`](../../../../infra/k8s/base/db/postgres-init/0008_seed_local_terms_version.sql).
- Header comments must state:
  - This runs on **first** Postgres init for **all** environments that use this bundle (not Docker-only).
  - Operators may supersede via migrations / terms lifecycle later.
  - Timestamp baseline matches shared dev/test convention (document `API_LATEST_TERMS_EFFECTIVE_AT` alignment).

### 2. Wire into K8s ConfigMaps

Update **both** generators so new SQL runs after `0006`:

- [`infra/k8s/base/stack/kustomization.yaml`](../../../../infra/k8s/base/stack/kustomization.yaml) — under `configMapGenerator` → `metaboost-postgres-init` → `files:`, add:
  - `- ../db/postgres-init/0007_default_terms_version.sql`
  - Keep lexicographic order consistent with comments (place after `0006_management_grants.sh`).
- [`infra/k8s/base/db/kustomization.yaml`](../../../../infra/k8s/base/db/kustomization.yaml) — under `metaboost-db-postgres-init`, add:
  - `- postgres-init/0007_default_terms_version.sql`

Update inline comments that currently say **`0001`–`0006` only** if present.

### 3. Docker Compose (local)

- [`infra/docker/local/docker-compose.yml`](../../../../infra/docker/local/docker-compose.yml):
  - Mount **`0007_default_terms_version.sql`** to `docker-entrypoint-initdb.d/` with a filename that sorts **before** the local user seed (e.g. `0007_default_terms_version.sql`).
  - Rename **`0007_seed_local_user.sql`** → preserve behavior but **renumber file** to **`0008_seed_local_user.sql`** (filesystem + compose mount target).
  - **Remove** mount for **`0008_seed_local_terms_version.sql`** (superseded by canonical `0007`).
- Delete obsolete file **`0008_seed_local_terms_version.sql`** after contents live in `0007_default_terms_version.sql`.

### 4. Docs

- [`infra/docker/local/INFRA-DOCKER-LOCAL.md`](../../../../infra/docker/local/INFRA-DOCKER-LOCAL.md): describe init order as `0001`–`0007` (canonical terms), then **`0008_seed_local_user.sql`** (local-only user).
- [`infra/k8s/INFRA-K8S.md`](../../../../infra/k8s/INFRA-K8S.md) (or relevant postgres-init section): note that **`0007_default_terms_version.sql`** is part of cluster bootstrap so API can satisfy `assertConfiguredForStartup`.

### 5. Verification scripts / CI

- Run / update **`make check_k8s_postgres_init_sync`** if checks assume exactly six SQL files—extend checks or document the seventh canonical file so CI does not regress.
- Grep for references to **`0008_seed_local_terms_version`** or “0008 terms” in docs and fix.

## Key files (summary)

| Action | Path |
|--------|------|
| Add | `infra/k8s/base/db/postgres-init/0007_default_terms_version.sql` |
| Edit | `infra/k8s/base/stack/kustomization.yaml` |
| Edit | `infra/k8s/base/db/kustomization.yaml` |
| Edit | `infra/docker/local/docker-compose.yml` |
| Rename | `0007_seed_local_user.sql` → `0008_seed_local_user.sql` |
| Delete | `0008_seed_local_terms_version.sql` (after merge) |
| Edit | `infra/docker/local/INFRA-DOCKER-LOCAL.md`, `infra/k8s/INFRA-K8S.md` (or equivalent) |
| Maybe edit | `.github/workflows/ci.yml` if it hardcodes init file lists |

## Verification

- **`make check_k8s_postgres_init_sync`** (or repo-documented equivalent) passes.
- Local: fresh Docker volume → Postgres runs `0007_default_terms_version` then `0008_seed_local_user`; `SELECT status FROM terms_version` shows **`active`**.
- K8s: ConfigMap contains new file; fresh PVC scenario documented for operators (Argo sync / apply).
- API boots against empty DB created from full init bundle without manual terms INSERT.

## Out of scope

- Changing **business** copy of terms or enforcement dates beyond the bootstrap baseline (handled by operations / future migrations).
- Podverse or other repos.
