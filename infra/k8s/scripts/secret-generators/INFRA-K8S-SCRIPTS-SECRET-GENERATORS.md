# Secret generators (`infra/k8s/scripts/secret-generators`)

SOPS-encrypted Kubernetes **Secret** manifests for Metaboost GitOps. Run from the **Metaboost monorepo root** unless you copy these scripts into your GitOps checkout (same relative **`./secrets/…`** output layout).

Canonical copies also live under **`metaboost.cc/scripts/secret-generators/`** for GitOps-only workflows; keep them aligned when changing generators here.

**CI:** [`.github/workflows/metaboost-infra-alpha-contracts.yml`](../../../../.github/workflows/metaboost-infra-alpha-contracts.yml) runs pinned **`kustomize build`** on **`infra/k8s/alpha/*`** overlays when **`infra/k8s/**`** changes (no cluster apply). Full SOPS auto-gen + DB + version contracts run in **`metaboost.cc`** — see **`metaboost.cc/scripts/secret-generators/README.md`\*\*.

## Prerequisites

- `kubectl`, `sops`, `openssl` (DB / Valkey generators), `uuidgen` (JWT generators)

## Run all auto-gen scripts

```bash
bash ./infra/k8s/scripts/secret-generators/create_all_secrets_auto_gen.sh alpha
```

This invokes **`--auto-gen`** for:

- **`create_api_secret.sh`** → Secret **`metaboost-api-secrets`**, key **`AUTH_JWT_SECRET`**
- **`create_management_api_secret.sh`** → Secret **`metaboost-management-api-secrets`**, key **`AUTH_JWT_SECRET`**
- **`create_db_secret.sh`** → Secret **`metaboost-db-secrets`** (full **`DB_APP_*`** and **`DB_MANAGEMENT_*`** role set)
- **`create_keyvaldb_secret.sh`** → Secret **`metaboost-keyvaldb-secrets`**, key **`KEYVALDB_PASSWORD`**
- **`create_mailer_secret.sh`** → Secret **`metaboost-mailer-opaque`** (`MAILER_USERNAME`, `MAILER_PASSWORD`; auto-gen leaves empty until you re-run interactively)

Base **`api/deployment.yaml`** references **`metaboost-api-secrets`**, **`metaboost-db-secrets`**, **`metaboost-keyvaldb-secrets`**, and optional **`metaboost-mailer-opaque`**.

## Individual scripts

```bash
bash ./infra/k8s/scripts/secret-generators/create_api_secret.sh
bash ./infra/k8s/scripts/secret-generators/create_management_api_secret.sh
bash ./infra/k8s/scripts/secret-generators/create_db_secret.sh
bash ./infra/k8s/scripts/secret-generators/create_keyvaldb_secret.sh
bash ./infra/k8s/scripts/secret-generators/create_mailer_secret.sh
bash ./infra/k8s/scripts/secret-generators/create_github_registry_secret.sh
bash ./infra/k8s/scripts/secret-generators/create_cloudflared_tunnel_secret.sh
bash ./infra/k8s/scripts/secret-generators/check_db_secret_contract.sh alpha
```

Use **`--auto-gen`** and **`--output-file`** flags where supported (same pattern as Podverse **`infra/k8s/scripts/secret-generators`**).

## Cloudflare (cert-manager DNS01)

Use **`scripts/infra/sops/create_cloudflare_api_token_secret.sh`** (repo root); see [REMOTE-K8S-GITOPS.md](../../../../docs/development/k8s/REMOTE-K8S-GITOPS.md).

## Cloudflare Tunnel (cloudflared)

Interactive SOPS manifest for **`cloudflared-tunnel-secret`** in namespace **`external-infra`**, key **`tunnel-token`**. Default output **`./secrets/cloudflared-tunnel-secret.enc.yaml`**; optional **`--output-file`**.

```bash
bash ./infra/k8s/scripts/secret-generators/create_cloudflared_tunnel_secret.sh
```

## Argo CD GitHub repository credentials

For Argo CD to clone **private GitHub** GitOps repos over HTTPS, use **`create_argocd_github_repo_secret.sh`** from your **GitOps repository root** (next to **`.sops.yaml`**). Produces a SOPS-encrypted repository `Secret` under **`./secrets/`**. Not invoked by **`create_all_secrets_auto_gen.sh`**. Default outputs follow **`<slug>-repo-creds`** / **`./secrets/<slug>-argoc-repo.enc.yaml`** (slug from URL); apply into **`argocd`**.

```bash
bash ./infra/k8s/scripts/secret-generators/create_argocd_github_repo_secret.sh
```

The same script may be copied into the Podverse monorepo or operator GitOps repositories for discoverability.

## Verify / apply

```bash
sops -d ./secrets/metaboost-alpha-api-secrets.enc.yaml
sops -d ./secrets/metaboost-alpha-api-secrets.enc.yaml | kubectl apply -f -
```
