# K8s env render (alpha / beta / prod)

Metaboost keeps the canonical variable list in [`infra/env/classification/base.yaml`](../../infra/env/classification/base.yaml) with optional overlays in [`infra/env/overrides/`](../../infra/env/overrides/). Each classification **env group** defines **`vars`** with per-key:

- **`kind: literal`** — Non-secret; emitted into **`source/metaboost-<suffix>-config.env`** (single dotenv file per workload) by `render_k8s_env.rb` when present in merged env (same as **`kind: config`** for K8s). The GitOps overlay **`kustomization.yaml`** uses **`configMapGenerator`** with **`envs:`** pointing at that file (Podverse-style). Values are escaped for Kustomize’s dotenv parser; **`make alpha_env_validate`** runs **`kubectl kustomize`** on each overlay to catch bad lines. Local `.env` generation may still treat literals separately from **`kind: config`**.
- **`kind: config`** — Emitted into the same **`source/metaboost-<suffix>-config.env`** when present in merged env (then into a ConfigMap via the overlay **`configMapGenerator`**).
- **`kind: secret`** — Emitted into the **Secret** when present in merged env.
- **`kind: source_only`** — In merged env for this env group but not emitted into that group’s CM/Secret (same role as former `literals_only_in_source`).

`scripts/k8s-env/render-k8s-env.sh` builds a merged env per classification env group with profile **`remote_k8s`**, an optional **GitOps classification overlay**, then `dev/env-overrides/<env>/*.env` (see [ENV-REFERENCE.md](ENV-REFERENCE.md)).

**Merge order (later wins on conflicts):** `infra/env/classification/base.yaml` → `infra/env/overrides/remote-k8s.yaml` (Metaboost monorepo; sets in-cluster **`API_SERVER_BASE_URL`** / **`MANAGEMENT_API_SERVER_BASE_URL`** for Next.js server-side fetch) → optional **`${METABOOST_K8S_OUTPUT_REPO}/apps/metaboost-<env>/env/remote-k8s.yaml`** (same `version` / `env_groups` shape as the monorepo overlay) → each `dev/env-overrides/<env>/*.env` in sorted filename order.

**`local_generator: hex_32` (opt-in fill):** Plain **`merge-env --profile remote_k8s`** does not synthesize secrets; classification **`local_generator`** is documentation unless you pass the flags **`render-k8s-env.sh`** uses: **`--fill-empty-local-generator-secrets`**, **`--hex32-state-file`** (temp file, removed on exit), and **`--reuse-plain-secrets-dir`** pointing at **`secrets/metaboost-<env>/plain/`** when that directory exists. For each **`kind: secret`** key with **`local_generator: hex_32`**, an empty merged value is replaced by (in order): existing non-empty overlay/classification value; **`stringData`** from any **`plain/*.yaml`** (later files override earlier keys); an existing line in the state file; **`SecureRandom.hex(32)`** (appended to the state file). That keeps shared keys consistent across env groups in one render (e.g. **`VALKEY_PASSWORD`** for **`api`** after **`valkey`**). **`validate-parity`** and ad-hoc **`merge-env`** do **not** pass these flags so output stays deterministic. See [ENV-REFERENCE.md](ENV-REFERENCE.md) § Merge order.

- If **`METABOOST_REMOTE_K8S_CLASSIFICATION_OVERLAY`** is set to an absolute path, that file is used instead of the default path under the GitOps repo.
- When **`METABOOST_K8S_OUTPUT_REPO`** is set, it is the root for the default GitOps overlay path even if rendered files are written elsewhere (e.g. drift validation renders to a temp dir but **exports `METABOOST_K8S_OUTPUT_REPO`** to the real clone first so the overlay is read from committed YAML).

On a real write (not `--dry-run`), it **prunes first** by removing only **generator-owned** paths: **`source/metaboost-*-config.env`** under each overlay component, legacy **`metaboost-*-config.bundle/`** directories (migration from the old per-key layout), plain Secret YAML paths, per-Deployment **`deployment-secret-env.yaml`** strategic-merge patches, and (when enabled in the manifest) plan-**05** **`deployment-ports-and-probes.yaml`** files — all defined in [`scripts/k8s-env/k8s-env-render-manifest.inc.sh`](../scripts/k8s-env/k8s-env-render-manifest.inc.sh) (same list the renderer writes). That removes stale artifacts when workloads or filenames change without touching hand-maintained `kustomization.yaml` entries (except generated patch filenames listed there), hand-maintained Deployment stubs, or other YAML in the overlay. Use **`--no-prune`** to skip deletion. **`--dry-run`** never prunes or writes.

**SOPS:** Cleartext workload Secrets are written under **`secrets/metaboost-<env>/plain/`**. Before Git commit, encrypt them in the GitOps repo (e.g. **`./scripts/encrypt_metaboost_plain_secrets.sh --namespace metaboost-<env>`** when that script exists; optional **`--rm-plain`** removes those cleartext files after encrypt). To batch-decrypt and **`kubectl apply`** the matching **`metaboost-*-secrets.enc.yaml`** (manual bootstrap or emergency apply), use **`./scripts/apply_metaboost_encrypted_secrets.sh`** when that script exists. See [REMOTE-K8S-GITOPS.md](REMOTE-K8S-GITOPS.md) Step 9.

### GitOps repo layout (thin overlays)

The GitOps repository (e.g. **k.podcastdj.com**) often holds **only** what differs per environment:
**`apps/metaboost-<env>/common/`** (namespace, ingress, TLS), per-component **`kustomization.yaml`**
that references **remote** bases in this monorepo (`infra/k8s/base/<component>/`), plus **rendered**
**`source/metaboost-*-config.env`** files consumed by **`configMapGenerator`** **`envs:`** in the same **`kustomization.yaml`**, **`deployment-secret-env.yaml`**, generated
**`deployment-ports-and-probes.yaml`**, and **`common/ingress-port-backends.yaml`**.
Hand-maintained ingress and **`kustomization.yaml`** are **not** pruned. **Public browser/API URLs**
in rendered config must match the hostnames on your ingress (for alpha on the shared cluster, that
is **metaboost.cc** — see [REMOTE-K8S-GITOPS.md](REMOTE-K8S-GITOPS.md),
[ARGOCD-GITOPS-METABOOST.md](ARGOCD-GITOPS-METABOOST.md), and the completed plan set
`.llm/plans/completed/metaboost-k8s-gitops-alignment/`).

### Deployment secret projection (`secretKeyRef`)

Do **not** use **`envFrom.secretRef`** for Metaboost-rendered secrets in GitOps Deployments: that injects **every** key in the Secret. Instead:

- Keep **`envFrom.configMapRef`** where the overlay app has non-secret config keys (the **`db`** app may have none after **`POSTGRES_DB`** is wired from the Secret in **`deployment-postgres.yaml`**).
- Add **`generatorOptions.disableNameSuffixHash: true`** and **`configMapGenerator`** with **`envs: [source/metaboost-<suffix>-config.env]`** in the component **`kustomization.yaml`** (do **not** list the dotenv under **`resources:`**), and add **`patchesStrategicMerge: [deployment-secret-env.yaml]`** in the same **`kustomization.yaml`** where secrets exist.
- The file **`deployment-secret-env.yaml`** is **generated** by `render_k8s_env.rb --emit secret-env-patch`: a strategic-merge patch that lists **`env[].valueFrom.secretKeyRef`** for each classified **`kind: secret`** key (same key set as **`metaboost-<suffix>-secrets`** `stringData`), sorted for stable diffs.

**Postgres:** The official image expects **`POSTGRES_USER`** / **`POSTGRES_PASSWORD`**; keep those as **hand-maintained** `env` entries in **`deployment-postgres.yaml`** mapping to **`DB_USER`** / **`DB_PASSWORD`** in **`metaboost-db-secrets`**. The generated patch still adds **`DB_*`** keys the init scripts need. **`Valkey`** uses **`VALKEY_PASSWORD`** in the generated patch; non-secret **`VALKEY_HOST`** / **`VALKEY_PORT`** (when present) render into **`source/metaboost-valkey-config.env`** and a generated ConfigMap.

Env groups with **no** classified secret keys (e.g. **`web-sidecar`**) do not get **`deployment-secret-env.yaml`**; drift validation skips the path when neither render nor the repo has the file.

The **`db`** env group lists **all** database-related keys under **`env_groups.db.vars`** in classification. Local dev writes them into one **`infra/config/local/db.env`** via **`merge-env --profile local_docker --group db`**. Postgres **role names and passwords** are **secret**; **`DB_HOST_SOURCE_ONLY`** / **`DB_PORT_SOURCE_ONLY`** are **`source_only`** (omitted from pod env by render); **`DB_HOST`** / **`DB_PORT`** are **`literal`** and appear in **`source/metaboost-db-config.env`** when merged (same as other non-secret literals), then in-cluster as a ConfigMap.

Make targets live in [`makefiles/gitops/Makefile.gitops-env.mk`](../../makefiles/gitops/Makefile.gitops-env.mk)
(included from [`makefiles/local/Makefile.local.mk`](../../makefiles/local/Makefile.local.mk)).

### Port sync (listen ports, Services, Ingress backends)

Plan **05** tooling keeps **container ports**, **probe ports**, **in-cluster URL env** on web / management-web Deployments (`API_SERVER_BASE_URL`, `MANAGEMENT_API_SERVER_BASE_URL`; see `apps/web/src/config/env.ts` and `apps/management-web/src/config/env.ts`), **Service `port` / `targetPort`**, and **Ingress `backend.service.port.number`**
aligned with classification literals (`API_PORT`, `WEB_PORT`, …) plus `dev/env-overrides/<env>/*.env`.

- **Contract:** [`infra/k8s/remote/port-contract.yaml`](../../infra/k8s/remote/port-contract.yaml) —
  in-cluster **postgres** / **valkey** probe ports (defaults `5432` / `6379`) and **Ingress** rule
  hostnames (alpha **metaboost.cc** defaults; edit when your GitOps ingress differs).
- **Generator:** [`scripts/k8s-env/render_remote_k8s_ports.rb`](../scripts/k8s-env/render_remote_k8s_ports.rb)
  — writes **`deployment-ports-and-probes.yaml`** under `api/`, `web/`, `management-api/`,
  `management-web/` and **`common/ingress-port-backends.yaml`** in the GitOps overlay.
- **Invoked automatically** at the end of **`make alpha_env_render`** / **`k8s_env_render`** (after env
  render). Standalone: **`make k8s_remote_ports_render`** / **`make alpha_remote_ports_validate`** /
  **`make k8s_remote_ports_validate`** (same `METABOOST_K8S_OUTPUT_REPO` and `K8S_ENV` as env render).
- **Drift:** [`validate-k8s-env-drift.sh`](../scripts/k8s-env/validate-k8s-env-drift.sh) runs the port
  generator into the same temp tree as env render and byte-compares port + ingress files.
  [`validate-remote-k8s-ports-drift.sh`](../scripts/k8s-env/validate-remote-k8s-ports-drift.sh) checks
  only port artifacts (faster).
- **Smoke:** [`scripts/k8s-env/test-render-remote-k8s-ports.sh`](../scripts/k8s-env/test-render-remote-k8s-ports.sh)
  (`--dry-run`).

Overlay **`kustomization.yaml`** must list **`deployment-ports-and-probes.yaml`** in
**`patchesStrategicMerge`** (after secret-env patches where present). **`common/kustomization.yaml`**
must patch ingress with **`ingress-port-backends.yaml`**. Generator-owned paths are listed in
[`k8s-env-render-manifest.inc.sh`](../scripts/k8s-env/k8s-env-render-manifest.inc.sh) (prune + drift).

## `METABOOST_K8S_OUTPUT_REPO`

**Render** (`alpha_env_render`, `k8s_env_render`) and **validate** (`alpha_env_validate`, `k8s_env_validate`) require
`METABOOST_K8S_OUTPUT_REPO` set to the **absolute path** of your GitOps repo clone (or any directory you want to emit
into). Export it once per shell or add it to your profile for a fixed path. The same variable selects the default path for the optional **`apps/metaboost-<env>/env/remote-k8s.yaml`** classification overlay.

**`METABOOST_REMOTE_K8S_CLASSIFICATION_OVERLAY`** (optional): absolute path to a single classification YAML file; when set, overrides the default GitOps overlay path above (useful for dry-run or nonstandard repo layouts).

**Dry-run** targets (`alpha_env_render_dry_run`, `k8s_env_render_dry_run`) print **rendered dotenv** content, Secret YAML, and patches to stdout only and **do not** require
this variable.

To emit into a local scratch directory, set the variable explicitly (not a default in tooling), for example:

```bash
mkdir -p "$PWD/out/k8s-env/alpha"
export METABOOST_K8S_OUTPUT_REPO="$PWD/out/k8s-env/alpha"
```

## Commands (from repo root)

- `make alpha_env_prepare` — Ensure `~/.config/metaboost/alpha-env-overrides/` exists and create missing override `.env` files with anchor keys and merged defaults (`remote_k8s` overlay; same generator as `make local_env_prepare`; existing files are not overwritten).
- `make alpha_env_link` — Symlink `dev/env-overrides/alpha/*.env` → existing files under `~/.config/metaboost/alpha-env-overrides/` so render reads the durable home copy.
- `make alpha_env_clean` — Remove `dev/env-overrides/alpha/*.env` in the repo (symlinks to home in normal use; real files there would be removed too). Does **not** delete `~/.config/metaboost/alpha-env-overrides/`. Run `make alpha_env_link` again before render if you use home overrides.
- `make alpha_env_prepare_link` — `prepare` then `link` (same idea as local prepare + link).
- `make alpha_env_render` — Emit **`source/metaboost-*-config.env`** per workload, **`deployment-secret-env.yaml`** patches, port + ingress patches (see **Port sync** above), and cleartext Secrets under `secrets/metaboost-<env>/plain/` (requires `METABOOST_K8S_OUTPUT_REPO`). Prunes generator-owned paths first (see above).
- `make k8s_remote_ports_render` / `make alpha_remote_ports_render` — Port + ingress patches only (`K8S_ENV` for the generic target).
- `make k8s_remote_ports_validate` / `make alpha_remote_ports_validate` — Drift-check port artifacts only.
- `make alpha_env_render_dry_run` — Print rendered YAML only (no writes, no prune; no output repo required).
- `make alpha_env_kustomize_check` — [`validate-gitops-kustomize-build.sh`](../../scripts/k8s-env/validate-gitops-kustomize-build.sh): runs **`kubectl kustomize`** on each component overlay (requires `METABOOST_K8S_OUTPUT_REPO`).
- `make alpha_env_validate` — [`validate-classification.sh`](../../scripts/k8s-env/validate-classification.sh) + [`validate-k8s-env-drift.sh`](../../scripts/k8s-env/validate-k8s-env-drift.sh) + **`alpha_env_kustomize_check`** (requires `METABOOST_K8S_OUTPUT_REPO`).

Suggested workflow: preview rendered output, validate (classification + config env / patch drift vs the clone + kustomize build), then write files into the output repo.

Examples with an explicit GitOps path:

```bash
export METABOOST_K8S_OUTPUT_REPO=/absolute/path/to/your-gitops-repo

make alpha_env_render_dry_run
make alpha_env_validate
make alpha_env_render
```

(`alpha_env_render_dry_run` does not require `METABOOST_K8S_OUTPUT_REPO`; you can run it before the `export` if you only want stdout.)

Generic env name (`beta` / `prod` when overlays exist):

```bash
export METABOOST_K8S_OUTPUT_REPO=/absolute/path/to/your-gitops-repo

make k8s_env_render_dry_run K8S_ENV=beta
make k8s_env_validate K8S_ENV=beta
make k8s_env_render K8S_ENV=beta
```

`make k8s_env_clean K8S_ENV=<name>` removes `dev/env-overrides/<name>/*.env` (repo symlinks in normal use); home `~/.config/metaboost/<name>-env-overrides/` is unchanged. `make alpha_env_clean` matches `make k8s_env_clean` with default `K8S_ENV=alpha`.

Scripts: [`prepare-k8s-env-overrides.sh`](../../scripts/k8s-env/prepare-k8s-env-overrides.sh) (delegates to [`prepare-home-env-overrides.sh`](../../scripts/env-overrides/prepare-home-env-overrides.sh)), [`link-k8s-env-overrides.sh`](../../scripts/k8s-env/link-k8s-env-overrides.sh). Canonical defaults: `infra/env/classification/`. Per-env working files: `dev/env-overrides/alpha/*.env` (symlinks to home after link, when those files exist under `~/.config/metaboost/alpha-env-overrides/`).

Optional: set `METABOOST_HOME_ENV_OVERRIDES_DIR` when running `link-k8s-env-overrides.sh` outside the default home path.

## Validation and drift

1. **Classification** — Every key under each env group’s **`vars`** in [`infra/env/classification/base.yaml`](../../infra/env/classification/base.yaml) must have a valid **`kind`** and **`default`** (overlap rules enforced by
   [`validate-classification.sh`](../../scripts/k8s-env/validate-classification.sh)). Env groups with `no_env_from` use
   only `literal` / `source_only` kinds (no `config`/`secret`).

2. **Config env and patch drift** — [`validate-k8s-env-drift.sh`](../../scripts/k8s-env/validate-k8s-env-drift.sh) renders into a
   temp directory with the same inputs as `make alpha_env_render`, then byte-compares each generated **`source/metaboost-*-config.env`**, each
   **`deployment-secret-env.yaml`**, and each plan-**05** **`deployment-ports-and-probes.yaml`**, and **`common/ingress-port-backends.yaml`**, to the committed files under `apps/metaboost-<env>/`. Paths match
   [`k8s-env-render-manifest.inc.sh`](../../scripts/k8s-env/k8s-env-render-manifest.inc.sh). If **both** render and the repo omit a config env file or patch (env group with no config or no secret keys), that path is skipped. **Secret values** under `secrets/.../plain/` are not compared (overrides and SOPS). The GitOps repo path must be set via `METABOOST_K8S_OUTPUT_REPO` (or `--output-repo`); if the
   overlay `apps/metaboost-<env>/` is missing, validation **fails** (exit 1).

```bash
export METABOOST_K8S_OUTPUT_REPO=/absolute/path/to/your-gitops-repo
make alpha_env_validate
```

## After render

1. Encrypt Secret manifests with SOPS (do not commit cleartext). Follow your GitOps repo’s deployment checklist (and [REMOTE-K8S-GITOPS.md](REMOTE-K8S-GITOPS.md) for the overall flow).
2. Commit **`source/metaboost-*-config.env`** under `apps/metaboost-<env>/*/`, generated **`deployment-secret-env.yaml`**, **`deployment-ports-and-probes.yaml`**, and **`common/ingress-port-backends.yaml`**.
3. Ensure overlay **`kustomization.yaml`** includes **`configMapGenerator`** with **`envs:`** + **`generatorOptions.disableNameSuffixHash: true`** for each config env file, **`patchesStrategicMerge`** for **`deployment-secret-env.yaml`** (where secrets exist), **`deployment-ports-and-probes.yaml`** (api, web, management-api, management-web), and **`common/ingress-port-backends.yaml`** on **`common/kustomization.yaml`**.
4. Push Git so Argo CD syncs.

## Requirements

- Ruby (stdlib YAML) for `render_k8s_env.rb`, `render_remote_k8s_ports.rb`, `validate-classification.sh`, and drift (via `render-k8s-env.sh`).
- **`kubectl`** (with built-in **`kustomize`**) for **`make alpha_env_kustomize_check`** / full **`alpha_env_validate`**.

## Related

- [GITOPS-CUTOVER-STAGING-CHECKLIST.md](GITOPS-CUTOVER-STAGING-CHECKLIST.md) — operator checklist when rolling GitOps changes on staging.
