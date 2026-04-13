# Remote K8s: reset Postgres data and align env

**Destructive:** Deletes database files on the volume. Use for disposable envs (e.g. alpha), not production without a backup plan.

**Context:** Changing Kubernetes Secrets does **not** change passwords already stored in Postgres. If secrets and the PVC are out of sync, wipe the volume and let first-start init run again, or apply manual SQL (below).

Full GitOps context: [REMOTE-K8S-GITOPS.md](REMOTE-K8S-GITOPS.md), env render: [K8S-ENV-RENDER.md](K8S-ENV-RENDER.md).

Replace **`metaboost-alpha`** with your namespace if different.

**Greenfield (new empty Postgres PVC):** The GitOps **`infra/k8s/base/db`** Deployment mounts the same **`docker-entrypoint-initdb.d`** ConfigMap as **`infra/k8s/base/stack`**, so combined schema SQL, the management database, ORM roles, and grants run automatically on first start when **`metaboost-db-secrets`** is applied before the pod initializes data. No separate bootstrap script is required for that path.

**Existing data / drift / password rotation without wipe:** Use **§4** (manual SQL from your machine) or delete the Postgres PVC and bring the pod back so **`PGDATA`** is empty and first-start init runs again (**§3**).

---

## 1. Align committed GitOps + Metaboost (ConfigMaps / plain secrets)

From the **Metaboost** repo root (with your GitOps clone path):

```bash
export METABOOST_K8S_OUTPUT_REPO="/absolute/path/to/your/gitops-repo"
./scripts/nix/with-env make alpha_env_validate
./scripts/nix/with-env make alpha_env_render
```

Edit **`apps/metaboost-alpha/env/remote-k8s.yaml`** (and any **`dev/env-overrides/alpha/*.env`** you use) until validate passes; re-run render after edits.

Commit and push the GitOps repo **`main`** (ConfigMaps, **`deployment-secret-env.yaml`**, port patches as generated).

Edit **`secrets/metaboost-alpha/plain/metaboost-*-secrets.yaml`** so every **`DB_*`** / **`VALKEY_*`** value is what you want **before** encrypting. **`metaboost-db-secrets`**, **`metaboost-api-secrets`**, and **`metaboost-management-api-secrets`** must agree on shared keys (same app DB name, same **`DB_APP_*`** role passwords, etc.).

From the **GitOps** repo root:

```bash
./scripts/encrypt_metaboost_plain_secrets.sh --namespace metaboost-alpha
./scripts/apply_metaboost_encrypted_secrets.sh --namespace metaboost-alpha
```

Commit only **`*.enc.yaml`** (not cleartext **`plain/`** if your repo ignores it). Sync Argo (or wait for auto-sync).

---

## 2. Optional: reset Valkey if **`VALKEY_PASSWORD`** changed

If the Valkey PVC was initialized with an old password, delete its data too (same pattern as Postgres):

```bash
kubectl -n metaboost-alpha scale deployment/valkey --replicas=0
kubectl -n metaboost-alpha delete pvc metaboost-valkey-data
```

Argo (or scale back up) recreates the Deployment; a new pod + empty volume picks up the current Secret.

---

## 3. Delete Postgres PVC (drop all Postgres data)

```bash
kubectl -n metaboost-alpha scale deployment/postgres --replicas=0
kubectl -n metaboost-alpha delete pvc metaboost-postgres-data
kubectl -n metaboost-alpha scale deployment/postgres --replicas=1
```

Wait until **`kubectl -n metaboost-alpha get pods`** shows **`postgres`** **Running**.

On first start with an **empty** volume, the official image runs **`docker-entrypoint-initdb.d`** from the Metaboost **`base/db`** ConfigMap (see **`infra/k8s/base/db/deployment-postgres.yaml`**): that creates the cluster superuser and app database from **`POSTGRES_*`**, runs shell/SQL init (management database, ORM roles, **`0003_app_schema.sql`**, **`0004`/`0005`** management load, **`0006`** grants). **You do not need §4** if this completed successfully.

---

## 4. Bootstrap schema and roles (when first-start init did not run)

Use this when **`PGDATA` already existed** (skipped init), the Postgres workload does not mount the init ConfigMap, or you must fix drift **without** deleting the PVC.

Work from **Metaboost** repo root so paths resolve. Forward Postgres:

```bash
kubectl -n metaboost-alpha port-forward svc/postgres 5432:5432
```

In a **second** terminal, load names/passwords from the cluster (adjust secret names if yours differ):

```bash
export NS=metaboost-alpha
export PGHOST=127.0.0.1
export PGPORT=5432
export PGUSER=$(kubectl get secret metaboost-db-secrets -n "$NS" -o jsonpath='{.data.DB_USER}' | base64 -d)
export PGPASSWORD=$(kubectl get secret metaboost-db-secrets -n "$NS" -o jsonpath='{.data.DB_PASSWORD}' | base64 -d)
export APP_DB=$(kubectl get secret metaboost-db-secrets -n "$NS" -o jsonpath='{.data.DB_APP_NAME}' | base64 -d)
export MGMT_DB=$(kubectl get secret metaboost-db-secrets -n "$NS" -o jsonpath='{.data.DB_MANAGEMENT_NAME}' | base64 -d)
```

Create the **management** database (empty) if it does not exist:

```bash
psql -d postgres -c "CREATE DATABASE \"$MGMT_DB\";"
```

Apply combined schema (main app DB, then management DB). Paths under **`infra/k8s/base/db/postgres-init/`** match **`stack`** (same assets):

```bash
psql -d "$APP_DB" -f infra/k8s/base/db/postgres-init/0003_app_schema.sql
psql -d "$MGMT_DB" -f infra/k8s/base/db/postgres-init/0005_management_schema.sql.frag
```

Create **role** users with passwords **identical** to the Secrets the APIs use. Read passwords from Secrets (same `base64 -d` pattern as above) for:

- **`DB_APP_READ_USER`** / **`DB_APP_READ_PASSWORD`**
- **`DB_APP_READ_WRITE_USER`** / **`DB_APP_READ_WRITE_PASSWORD`**
- **`DB_MANAGEMENT_READ_USER`** / **`DB_MANAGEMENT_READ_PASSWORD`**
- **`DB_MANAGEMENT_READ_WRITE_USER`** / **`DB_MANAGEMENT_READ_WRITE_PASSWORD`**

Example (replace **`…`** with real usernames/passwords from your Secrets; escape single quotes in passwords as **`''`** inside SQL):

```bash
psql -d postgres -v ON_ERROR_STOP=1 -c "CREATE ROLE \"…\" LOGIN PASSWORD '…';"
# repeat for each of the four roles, or use one DO block — see makefiles/local/Makefile.local.test.mk
```

Then run the **`GRANT`** / **`ALTER DEFAULT PRIVILEGES`** blocks for the app database and the management database. **Canonical copy-paste:** duplicate the logic in **`makefiles/local/Makefile.local.test.mk`** targets **`test_db_init`** and **`test_db_init_management`**, substituting:

- **`$(TEST_DB_NAME)`** → **`$APP_DB`**
- **`$(TEST_MANAGEMENT_DB_NAME)`** → **`$MGMT_DB`**
- **`'test'`** passwords → the real values from your Secrets

---

## 5. Restart API workloads and verify

```bash
kubectl -n metaboost-alpha rollout restart deployment/api deployment/management-api
kubectl -n metaboost-alpha logs deployment/api --tail=80
kubectl -n metaboost-alpha logs deployment/management-api --tail=80
```

Create the first management super admin once the management API is healthy: [REMOTE-K8S-GITOPS.md](REMOTE-K8S-GITOPS.md) — **Step 12**.

---

## 6. Quick alignment checklist

| Check                                                    | Where                                                                                                                                                                                     |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Non-secret env (URLs, **AUTH_MODE**, cookies, agents, …) | Rendered ConfigMaps in GitOps; **`make alpha_env_validate`**                                                                                                                              |
| DB superuser + **`DB_APP_NAME`**                         | **`metaboost-db-secrets`** → Postgres **`POSTGRES_*`**                                                                                                                                    |
| App ORM users                                            | **`metaboost-api-secrets`** **`DB_APP_*`** = roles + passwords in Postgres                                                                                                                |
| Management DB name + ORM users                           | **`DB_MANAGEMENT_NAME`** in **`metaboost-db-secrets`** (cluster-wide); **`DB_MANAGEMENT_READ_*` / `DB_MANAGEMENT_READ_WRITE_*`** in **`metaboost-management-api-secrets`** match Postgres |
| Valkey                                                   | **`VALKEY_PASSWORD`** consistent across **`api`**, **`management-api`**, **`valkey`** secrets and a fresh Valkey volume if you rotated it                                                 |
