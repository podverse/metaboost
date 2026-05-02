# Remote K8s: reset Postgres data and align env

**Destructive:** Deletes database files on the volume. Use for disposable envs (e.g. alpha), not production without a backup plan.

**Context:** Changing Kubernetes Secrets does **not** change passwords already stored in Postgres. If secrets and the PVC are out of sync, wipe the volume and let first-start init run again, or apply manual SQL (below).

Full GitOps context: [REMOTE-K8S-GITOPS.md](REMOTE-K8S-GITOPS.md).

Replace **`metaboost-alpha`** with your namespace if different.

**Greenfield (new empty Postgres PVC):** The GitOps **`infra/k8s/base/db`** Deployment mounts **`docker-entrypoint-initdb.d`** from generated bootstrap ConfigMaps, so **`0003_apply_linear_baselines.sh`** with **`0003a`** / **`0003b`** runs automatically on first start when **`metaboost-db-secrets`** is applied before the pod initializes data. No separate bootstrap script is required for that path.

**Existing data / drift / password rotation without wipe:** Use **§4** (manual SQL from your machine) or delete the Postgres PVC and bring the pod back so **`PGDATA`** is empty and first-start init runs again (**§3**).

---

## 1. Align committed GitOps files (ConfigMaps / plain secrets)

Edit env/manifests directly in your **GitOps** repo.

Commit and push the GitOps repo **`main`** (ConfigMaps, secret patches, port patches).

Edit **`secrets/metaboost-alpha/plain/metaboost-*-secrets.yaml`** so every **`DB_*`** / **`KEYVALDB_*`** value is what you want **before** encrypting. **`metaboost-db-secrets`**, **`metaboost-api-secrets`**, and **`metaboost-management-api-secrets`** must agree on shared keys (same app DB name, same **`DB_APP_*`** role passwords, etc.).

From the **GitOps** repo root:

```bash
./scripts/encrypt_metaboost_plain_secrets.sh --namespace metaboost-alpha
./scripts/apply_metaboost_encrypted_secrets.sh --namespace metaboost-alpha
```

Commit only **`*.enc.yaml`** (not cleartext **`plain/`** if your repo ignores it). Sync Argo (or wait for auto-sync).

---

## 2. Optional: reset Valkey if **`KEYVALDB_PASSWORD`** changed

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

On first start with an **empty** volume, the official image runs **`docker-entrypoint-initdb.d`** from the Metaboost **`base/db`** ConfigMap (see **`infra/k8s/base/db/deployment-postgres.yaml`**): that creates the cluster superuser and app database from **`POSTGRES_*`**, runs shell init (**`0001`**/**`0002`**), then runs **`0003_apply_linear_baselines.sh`** (per-DB owners/migrators). **You do not need §4** if this completed successfully.

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
export PGUSER=$(kubectl get secret metaboost-db-secrets -n "$NS" -o jsonpath='{.data.DB_APP_OWNER_USER}' | base64 -d)
export PGPASSWORD=$(kubectl get secret metaboost-db-secrets -n "$NS" -o jsonpath='{.data.DB_APP_OWNER_PASSWORD}' | base64 -d)
export APP_DB=$(kubectl get secret metaboost-db-secrets -n "$NS" -o jsonpath='{.data.DB_APP_NAME}' | base64 -d)
export MGMT_DB=$(kubectl get secret metaboost-db-secrets -n "$NS" -o jsonpath='{.data.DB_MANAGEMENT_NAME}' | base64 -d)
```

Create the **management** database (empty) if it does not exist:

```bash
psql -d postgres -c "CREATE DATABASE \"$MGMT_DB\";"
```

Apply canonical schema migration SQL (main app DB, then management DB). Paths under **`infra/k8s/base/db/source/`** match base stack/db assets:

```bash
psql -d "$APP_DB" -f infra/k8s/base/db/source/app/0001_app_schema.sql
psql -d "$MGMT_DB" -f infra/k8s/base/db/source/management/0001_management_schema.sql
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

| Check                                                              | Where                                                                                                                                                                                     |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Non-secret env (URLs, **ACCOUNT_SIGNUP_MODE**, cookies, agents, …) | ConfigMaps in GitOps overlays (manually maintained or generated in GitOps tooling)                                                                                                        |
| DB superuser + **`DB_APP_NAME`**                                   | **`metaboost-db-secrets`** → Postgres **`POSTGRES_*`**                                                                                                                                    |
| App ORM users                                                      | **`metaboost-api-secrets`** **`DB_APP_*`** = roles + passwords in Postgres                                                                                                                |
| Management DB name + ORM users                                     | **`DB_MANAGEMENT_NAME`** in **`metaboost-db-secrets`** (cluster-wide); **`DB_MANAGEMENT_READ_*` / `DB_MANAGEMENT_READ_WRITE_*`** in **`metaboost-management-api-secrets`** match Postgres |
| Valkey                                                             | **`KEYVALDB_PASSWORD`** consistent across **`api`**, **`management-api`**, **`valkey`** secrets and a fresh Valkey volume if you rotated it                                               |
