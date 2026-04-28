---
name: classification-env
description: Use when adding or changing environment variables, infra/env/classification YAML, scripts/env-classification, K8s env render, or local env generation.
---

# Classification-driven env

## Canonical source

- **`infra/env/classification/base.yaml`** — Top-level **`env_groups`**: per-group **`vars`** with **`kind`** (`literal`, `config`, `secret`, `source_only`) and **`default`**. Optional **`inherits`** (ordered list: **`from`**, optional **`file_splits`** for **`http`** or **`valkey`** only, required non-empty **`map`**: source var name → target var name) composes the **effective** var set for merge and K8s render—**only keys listed in `map` are imported** from each inherit row (identity = same name twice); own **`vars`** win on conflicts; see **`docs/development/env/ENV-REFERENCE.md`** § Env group inherits. Env group **`db`** uses a single top-level **`vars`** map (no split buckets; **`from: db`** inherits use **`map`** only). Split-catalogued env groups (**`http`**, **`valkey`**) do not use top-level **`inherits`**. Env group **`http`** uses buckets **`api`**, **`web-sidecar`**, **`web`**, **`management-api`**, **`management-web-sidecar`**, **`management-web`** (each key appears in one bucket; consumers list all needed buckets in **`file_splits`** and every imported key under **`map`**). Env group **`locale`** holds shared **`DEFAULT_LOCALE`** / **`SUPPORTED_LOCALES`**; sidecars use **`map`** to **`NEXT_PUBLIC_*`**. Env group **`auth`** holds **`ACCOUNT_SIGNUP_MODE`**; **`api`** and **`management-api`** inherit with identity **`map`**; **`web-sidecar`** maps to **`NEXT_PUBLIC_ACCOUNT_SIGNUP_MODE`**. Optional **`override_file`** (non-empty logical name ⇒ home-override anchor), **`override_role`** (**`derived`** / **`none`** only—never **`anchor`**), and **`derived_from`** document anchors and fan-out; merge/render ignore them (see **`ENV-REFERENCE`** § Override metadata). Optional **`local_generator`** (`hex_32`) on **`kind: secret`** marks keys filled by **`scripts/local-env/setup.sh`**; default **`merge-env`** ignores it. **`render-k8s-env.sh`** passes **`merge-env`** flags to fill empties from **`plain/*.yaml`**, a per-run state file, and **`SecureRandom.hex(32)`**—keep **`setup.sh`** aligned when adding secrets. Env groups **`http`** / **`valkey`** nest **`vars`** under **split bucket keys** (hyphenated: **`http`** buckets **`api`**, **`web-sidecar`**, …; **`valkey-source-only`**, **`valkey`**) instead of per-var **`file_split`**. Local Postgres uses **one** **`infra/config/local/db.env`** from **`merge-env --profile local_docker --group db`**; **`write-valkey-split`** maps **`valkey`** buckets to **`valkey-source-only.env`** and **`valkey.env`** (**`http`** is inherit-only).
- **`infra/env/overrides/*.yaml`** — Profile overlays (`dev`, `local-docker`, `local-k8s`, `remote-k8s`); only override keys that differ from base (usually `default` only). For **`remote_k8s`**, **`render-k8s-env.sh`** also merges an optional **`apps/metaboost-<env>/env/remote-k8s.yaml`** from the GitOps repo when **`METABOOST_K8S_OUTPUT_REPO`** is set (or **`METABOOST_REMOTE_K8S_CLASSIFICATION_OVERLAY`** for a custom path); use that for per-deployment URLs, cookie domains, and CORS. See **`docs/development/k8s/K8S-ENV-RENDER.md`**.
- **YAML anchors / merge keys** — Supported for DRY repeated `inherits[]` maps when needed; `YAML.safe_load` uses `aliases: true` in `metaboost_env_merge.rb` and `validate-classification.sh`.
- **Human docs:** `docs/development/env/ENV-REFERENCE.md` — Sparse YAML `#` comments are OK for rationale (e.g. host vs in-cluster ports); prefer structured override metadata for home-override topology (`~/.config/metaboost/`).

## Generators

- **`scripts/env-classification/metaboost-env.rb`** — `merge-env`, `write-valkey-split`.
- **`scripts/env-overrides/prepare-home-env-overrides.sh`** + **`write-home-override-stubs.rb`** — `make local_env_prepare` / K8s `*_env_prepare`: ensures home override dir and creates missing `*.env` files with every anchor key and merged classification defaults (`local_docker` or `remote_k8s`); does not overwrite existing `KEY=` lines; appends missing anchor keys with defaults (`--force` on the Ruby script replaces entire stub files).
- **`scripts/local-env/setup.sh`** — Creates missing `infra/config/local/*.env` and app env files from `dev` / `local_docker` profiles.
- **`scripts/k8s-env/render-k8s-env.sh`** — Merges `remote_k8s` (monorepo + optional GitOps **`env/remote-k8s.yaml`**) + `dev/env-overrides/<env>/*.env`, then renders ConfigMaps, Secrets, and **`deployment-secret-env.yaml`** (`secretKeyRef` patches) via `render_k8s_env.rb`.

## Do

- **Validate** after YAML changes: `bash scripts/k8s-env/validate-classification.sh` and `bash scripts/env-classification/validate-parity.sh`.
- **Keep** **`render_k8s_env.rb`** bucket logic aligned with **`kind`** (buckets use **`MetaboostEnvMerge.effective_env_group_var_specs`** via **`derive_render_buckets`**).
- **DB admin role keys:** The **`db`** group defines **`DB_APP_ADMIN_USER`**, **`DB_APP_ADMIN_PASSWORD`**, **`DB_MANAGEMENT_ADMIN_USER`**, and **`DB_MANAGEMENT_ADMIN_PASSWORD`** (plus `DB_APP_NAME` / `DB_MANAGEMENT_NAME` and read-only / read-write users). These are the authoritative names for Postgres bootstrap and migration users. Do not add legacy **`DB_USER` / `DB_PASSWORD`** as generic cluster “superuser” keys; map **`POSTGRES_*`** only in Compose/K8s for the official **`postgres` image** when needed. See **linear-db-migrations** for the full contract.

## Don't

- Do not reintroduce **`apps/*/.env.example`** or **`dev/env-overrides/examples/`** as the source of truth; use **`infra/env/classification/base.yaml`** + optional home overrides (`~/.config/metaboost/`) and this skill.

## Related

- **argocd-gitops-push** — When changing K8s manifests or GitOps outputs, remind to push the GitOps repo.
- **linear-db-migrations** (`.cursor/skills/linear-db-migrations/SKILL.md`) — Linear SQL layout, ops bundles, and `POSTGRES_*` mapping.
- **`docs/development/k8s/REMOTE-K8S-GITOPS.md`** — Generic remote cluster + GitOps flow (no vendor domains).
