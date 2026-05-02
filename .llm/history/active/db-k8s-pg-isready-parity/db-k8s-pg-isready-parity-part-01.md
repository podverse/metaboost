# db-k8s-pg-isready-parity

## Context

Metaboost Postgres K8s probes used `pg_isready -U` without `-d`, defaulting dbname to username and causing `FATAL: database "metaboost_app_owner" does not exist` on probe interval. Align with Podverse `statefulset.yaml`.

---

### Session 1 - 2026-05-02

#### Prompt (Developer)

fix it

#### Key Decisions

- Readiness/liveness use `pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"` with probe timings aligned to Podverse (`timeoutSeconds`, `failureThreshold`, liveness initialDelay 60).
- Local Compose healthcheck uses `$$POSTGRES_USER` / `$$POSTGRES_DB` for in-container expansion.

#### Files Created/Modified

- `infra/k8s/base/db/deployment-postgres.yaml`
- `infra/docker/local/docker-compose.yml`
- `.llm/history/active/db-k8s-pg-isready-parity/db-k8s-pg-isready-parity-part-01.md`
