# Environment variables (classification)

Metaboost environment variable **names**, **defaults**, and **Kubernetes handling** (ConfigMap vs Secret vs literal injection) are defined in **`infra/env/classification/base.yaml`**, with scenario overlays under **`infra/env/overrides/`**.

YAML **`#` line comments** may appear in classification files for human rationale (e.g. **host vs in-cluster** ports in [`base.yaml`](../../infra/env/classification/base.yaml) and profile overlays); merge and validate **ignore** them. Optional **structured** fields on each key (`override_file`, `override_role`, `derived_from`) document home-override topology; merge and render **ignore** them. A non-empty **`override_file`** (logical name) marks a **home-override anchor**; do **not** set **`override_role: anchor`** (the validator rejects it). Use **`override_role`** only for **`derived`** (with **`derived_from`**) or **`none`** (explicit opt-out from override flows). Env group **`db`** uses a single top-level **`vars`** map (key order in YAML is emit order for **`merge-env --profile local_docker --group db`** and local **`infra/config/local/db.env`**). Env groups **`http`** and **`valkey`** nest vars under **split bucket keys** (hyphenated YAML keys: **`api`**, **`web-sidecar`**, **`web`**, **`management-api`**, **`management-web-sidecar`**, **`management-web`** under **`http`**; **`valkey-source-only`**, **`valkey`**), each bucket **`{ vars: { … } }`**. Split-catalogued env groups (**`http`**, **`valkey`**) must not use top-level **`inherits`**. For **`valkey`**, **`write-valkey-split`** maps buckets to **`valkey-source-only.env`** and **`valkey.env`**; merge and GitOps render **ignore** bucket structure for **`http`** (effective vars flatten buckets in canonical order). Each **`http`** key lives in **one** bucket only; consumers use **`file_splits`** to list every bucket they need (e.g. **`management-web-sidecar`** uses **`[api, web, management-api, management-web-sidecar]`**). **`DB_*_SOURCE_ONLY`** and **`VALKEY_*_SOURCE_ONLY`** (**`source_only`**) hold in-network service identity; paired **`DB_HOST`/`DB_PORT`** and **`VALKEY_HOST`/`VALKEY_PORT`** (**`literal`**) are client endpoints. **`base.yaml`** defaults those literals to **`localhost`** with host-mapped ports (**`5532`** / **`6479`**) for **`npm run dev:all`**; profile overlays **`local_docker`**, **`local_k8s`**, and **`remote_k8s`** restore **`postgres`/`5432`** and **`valkey`/`6379`** for in-network workloads. Optional **`local_generator`** (`hex_32` on **`kind: secret`**) documents keys **`scripts/local-env/setup.sh`** auto-fills (see below). Default **`merge-env`** treats it as documentation only (empty **`default`** stays empty). **`scripts/k8s-env/render-k8s-env.sh`** passes opt-in **`merge-env`** flags so those keys can be filled during K8s render (see [K8S-ENV-RENDER.md](K8S-ENV-RENDER.md)); omit those flags for deterministic merge (**`validate-parity`**, ad-hoc **`merge-env`**). This document lists **what each env group is for**, **kind** semantics, **override metadata**, **split buckets** (**`http`** / **`valkey`**), and **local generators**.

## Merge order

1. **`base.yaml`** — Defaults aligned with host **`npm run dev:all`** against local Postgres/Valkey published on **`localhost:5532`** / **`localhost:6479`** (`make local_infra_up` style).
2. **Profile overlay** — e.g. `local-docker.yaml`, `local-k8s.yaml`, `remote-k8s.yaml` (underscores in CLI/API map to hyphenated filenames). There is **no** `dev.yaml` overlay; **`--profile dev`** merges **`base.yaml`** only.
3. **`dev/env-overrides/<env>/*.env`** — Last wins for GitOps render (`render-k8s-env.sh` passes these as `--extra-env` after the merged classification).
4. **Generated secrets (local only)** — After merged env files exist, **`scripts/local-env/setup.sh`** runs `first_non_empty_or_generate` so existing non-empty values survive across runs; otherwise it generates new material. Keys that participate are tagged in **`base.yaml`** with **`local_generator`** (`hex_32`). Implementation lives in **`setup.sh`** (`generate_hex_32`); keep that script aligned with **`local_generator`** when adding or renaming secrets.

5. **Generated secrets (K8s render)** — **`render-k8s-env.sh`** calls **`merge-env`** with **`--fill-empty-local-generator-secrets`**, a per-run **`--hex32-state-file`**, and (when **`secrets/metaboost-<env>/plain/`** exists) **`--reuse-plain-secrets-dir`**. For each empty **`kind: secret`** + **`local_generator: hex_32`** key: use non-empty merged value if set; else aggregate **`stringData`** from existing **`plain/*.yaml`**; else the state file (shared across groups in one run); else **`SecureRandom.hex(32)`**. Non-**`hex_32`** secrets (e.g. **mailer**) still come from overrides. **`--dry-run`** can print generated values—treat as sensitive.

**Local sidecar paths:** **`infra/config/local/*-sidecar.env`** is **`merge-env --profile local_docker`** for Compose only. **`apps/*/sidecar/.env`** is **`merge-env --profile dev`** for host CLI sidecars (same profile as **`apps/web/.env.local`**); it is not derived by copying the infra sidecar files.

**Key order in output:** Generated `.env` files, home override stubs, and Kubernetes ConfigMap **`data`** / Secret **`stringData`** follow **effective** var order: inherited keys first (see **Env group inherits**), then keys from the env group’s own **`vars`** (or flattened split-bucket order for **`http`** and **`valkey`**) so overrides appear at the end. Keys supplied only via **`--extra-env`** files and not present in the effective spec are appended afterward in the order they appear in those files.

## Env group inherits (optional)

An env group may list **`inherits`** as an **ordered array** of mappings next to **`vars`**. Each entry has:

- **`from`** — Name of another env group under **`env_groups`** (e.g. **`valkey`**, **`db`**). Resolution is **shallow**: only that env group’s own **`vars`** are copied (**`http`** and **`valkey`**: vars flattened from split buckets in order; **`db`** and other env groups: top-level **`vars`** only; transitive inherits on the source are not expanded).
- **`file_splits`** — Optional; **only when `from` is `http` or `valkey`**. If omitted (or null), **all** keys from that source (all split buckets) are eligible for **`map`** source names. If set to a non-empty array, only keys under the listed **split bucket names** are included (**`http`**: **`api`**, **`web-sidecar`**, **`web`**, **`management-api`**, **`management-web-sidecar`**, **`management-web`**; valkey: **`valkey-source-only`**, **`valkey`**). An explicit empty array **`file_splits: []`** includes **no** keys from that inherit entry. **`api`** / **`management-api`** use **`file_splits: [valkey]`** so **`VALKEY_*_SOURCE_ONLY`** stay on the valkey env group / source-only file only. Env group **`db`** has no split buckets; **`from: db`** inherits use **`map`** only (all **`db.vars`** keys are available as sources).
- **`map`** — **Required** on every inherit entry (with **`from`**): a non-empty mapping **source var name → target var name** on the **inheriting** env group. **Only** keys listed in **`map`** are imported; there is no implicit pass-through. **Identity** uses the same name twice (e.g. **`DEFAULT_LOCALE: DEFAULT_LOCALE`**). **Rename** lists the source on the left and the consuming name on the right (e.g. **`DEFAULT_LOCALE: NEXT_PUBLIC_DEFAULT_LOCALE`** on **`web-sidecar`**). Every **source** key must exist in the filtered **`from`** vars (respecting **`file_splits`**). **`override_role`**, **`override_file`**, and **`derived_from`** are **stripped** when source ≠ target so **`locale.env`** / **`auth.env`** stubs stay keyed by canonical names on the source env group. Targets whose name starts with **`NEXT_PUBLIC_`** get **`kind: config`** when the source was **`literal`**, so GitOps render still emits them into the sidecar ConfigMap. Duplicate source keys or duplicate targets in the same **`map`** are invalid (**`validate-classification.sh`**).

**Precedence:** Later inherit entries **replace** earlier ones on the same key. Keys in the env group’s own **`vars`** are merged on top (**`merge-env`** uses **`merge_var_specs`**, so nested fields on a spec can deep-merge). For a full override of a key, redefine it under **`vars`**.

**Consumers:** **`flatten_env_group_env`**, **`reorder_env_map_to_group_vars`**, **`derive_render_buckets`**, and **`render_k8s_env.rb`** all use the **effective** var spec map (inherits + own **`vars`** or flattened split buckets), so **`kind`** and CM/Secret routing stay correct for inherited keys. Env groups **`api`**, **`management-api`**, and **`web-sidecar`** inherit **`from: auth`** for **`AUTH_MODE`** (single definition in env group **`auth`**). Env groups **`api`** and **`management-api`** also inherit **`locale`**, **`valkey`** with **`file_splits: [valkey]`**, and **`from: db`** with an explicit **`map`** for each imported **`DB_*`** key. **`base.yaml`** defines host client literals (**`localhost`**, **`5532`**, **`6479`**); **`local-docker`**, **`local_k8s`**, and **`remote_k8s`** overlays override **`db.vars`** and **`valkey.valkey.vars`** for in-cluster / Compose service DNS and container ports. Env group **`api`** also inherits **`from: mailer`** for **`MAILER_*`** (see **Mailer** below), **`from: http`** with **`file_splits: [api, web]`** and an explicit **`map`** for every imported key (**`WEB_BASE_URL`**, **`WEB_PORT`**, main API URLs). **`API_CORS_ORIGINS`** is **`api.vars`** (**`literal`**; local default matches **`http.web`** **`WEB_BASE_URL`**; no home-override file). **`web-sidecar`** inherits **`from: http`** with **`file_splits: [api, web, web-sidecar]`** and **`map`** entries that rename **`API_VERSION_PATH`**, **`API_PUBLIC_BASE_URL`**, and **`WEB_BASE_URL`** to **`NEXT_PUBLIC_*`** while listing **`API_PORT`**, **`API_SERVER_BASE_URL`**, **`WEB_PORT`**, and **`WEB_SIDECAR_PORT`** with identity (**`X: X`**). **`web`** and **`management-web`** inherit **`from: http`** with **`file_splits: [web]`** / **`[management-web]`** and **`map`** for **`WEB_BASE_URL`** / **`WEB_PORT`** or **`MANAGEMENT_WEB_*`** (alongside literal **`RUNTIME_CONFIG_URL`**). **`management-api`** inherits **`from: http`** with **`file_splits: [api, web, management-api, management-web]`** and **`map`** including **`API_VERSION_PATH: MANAGEMENT_API_VERSION_PATH`** plus identity for the other HTTP keys; **`MANAGEMENT_API_CORS_ORIGINS`** is **`management-api.vars`** (**`literal`**; local default matches **`http.management-web`** **`MANAGEMENT_WEB_BASE_URL`**; no home-override file). **`management-web-sidecar`** inherits **`from: http`** with **`file_splits: [api, web, management-api, management-web-sidecar]`** and **`map`** that renames **`API_VERSION_PATH`**, **`WEB_BASE_URL`**, and **`MANAGEMENT_API_PUBLIC_BASE_URL`** to **`NEXT_PUBLIC_*`** while listing the remaining keys with identity.

**Locale:** Env group **`locale`** holds **`DEFAULT_LOCALE`** and **`SUPPORTED_LOCALES`** (**`override_file: locale`**). **`merge-env`** runs **`apply_locale_next_public_sync`** for sidecars so **`--extra-env`** files that only set canonical keys still refresh **`NEXT_PUBLIC_*`** after overlays.

**Auth:** Env group **`auth`** holds **`AUTH_MODE`** (**`override_file: auth`**). **`api`** and **`management-api`** inherit it with identity **`map`**; **`web-sidecar`** inherits with **`map`** **`AUTH_MODE: NEXT_PUBLIC_AUTH_MODE`**. **`merge-env`** runs **`apply_auth_mode_next_public_sync`** for **`web-sidecar`** so **`--extra-env`** files that set **`AUTH_MODE`** still refresh **`NEXT_PUBLIC_AUTH_MODE`** after overlays (same idea as locale).

**Info (display / transactional email):** Env group **`info`** holds **`WEB_BRAND_NAME`** and **`MANAGEMENT_WEB_BRAND_NAME`** (**`override_file: info`**). **`api`** inherits both with identity **`map`** (mailer uses **`WEB_BRAND_NAME`** in email copy). **`web-sidecar`** inherits **`info`** with **`map`** **`WEB_BRAND_NAME: NEXT_PUBLIC_WEB_BRAND_NAME`**; **`management-web-sidecar`** uses **`MANAGEMENT_WEB_BRAND_NAME: NEXT_PUBLIC_MANAGEMENT_WEB_BRAND_NAME`**. **`merge-env`** runs **`apply_info_next_public_sync`** for both sidecars so **`--extra-env`** files that set the canonical keys still refresh **`NEXT_PUBLIC_*`** after overlays.

**HTTP (split buckets by consumer):** Env group **`http`** is split-catalogued (no top-level **`vars`**). Buckets: **`api`** (**`API_PORT`**, **`API_VERSION_PATH`**, **`API_PUBLIC_BASE_URL`** and **`API_SERVER_BASE_URL`** as **`literal`**), **`web-sidecar`** (**`WEB_SIDECAR_PORT`**), **`web`** (**`WEB_BASE_URL`**, **`WEB_PORT`**), **`management-api`** (**`MANAGEMENT_API_PORT`**, **`MANAGEMENT_API_PUBLIC_BASE_URL`** and **`MANAGEMENT_API_SERVER_BASE_URL`** as **`literal`**), **`management-web-sidecar`** (**`MANAGEMENT_WEB_SIDECAR_PORT`**), **`management-web`** (**`MANAGEMENT_WEB_BASE_URL`**, **`MANAGEMENT_WEB_PORT`**). **`api`** uses **`file_splits: [api, web]`** and lists every imported key in **`map`**; **`API_CORS_ORIGINS`** is on **`api.vars`**, not on env group **`http`**. **`web-sidecar`** uses **`[api, web, web-sidecar]`** with a full **`map`**. **`management-api`** uses **`[api, web, management-api, management-web]`**; **`MANAGEMENT_API_CORS_ORIGINS`** is on **`management-api.vars`**, not on env group **`http`**. **`management-web-sidecar`** uses **`[api, web, management-api, management-web-sidecar]`**; **`MANAGEMENT_WEB_SIDECAR_PORT`** is the sidecar listen port (same name in merged env). Env group **`http`** is **inherit-only** (not a GitOps render target as its own ConfigMap). Profile **`local_docker`** overrides **`API_SERVER_BASE_URL`** under **`env_groups.http.api.vars`** and **`MANAGEMENT_API_SERVER_BASE_URL`** under **`env_groups.http.management-api.vars`**. Profile **`remote_k8s`** clears **`WEB_BASE_URL`** under **`http.web`** and **`MANAGEMENT_WEB_BASE_URL`** under **`http.management-web`**. **Postgres (K8s):** The official image reads **`POSTGRES_DB`** for the initial database name; that value is the same as **`DB_APP_NAME`** in classification. GitOps and local stack deployments set **`POSTGRES_DB`** via **`secretKeyRef`** → **`DB_APP_NAME`** on **`metaboost-db-secrets`** (no separate **`POSTGRES_*`** keys in classification). Management database creation uses **`DB_MANAGEMENT_NAME`** in init scripts and env patches, not **`POSTGRES_MANAGEMENT_DB`**.

**Mailer:** Env group **`mailer`** holds **`MAILER_*`** (**`override_file: mailer`**); every key uses **`kind: secret`** so GitOps render routes the whole set to the API **Secret** (not ConfigMap). Only **`api`** consumes mail today; it inherits **`from: mailer`** so another env group can reuse the same block by adding **`inherits: - from: mailer`** (or a future transitive chain) without duplicating YAML. The API uses Nodemailer with default **`secure: false`**: the connection uses **STARTTLS** when the SMTP server advertises it (e.g. submission port **587**). **Port 465** (implicit TLS / SMTPS) is **not** supported without adding transport options (e.g. **`secure: true`**) in code.

**Validation:** **`scripts/k8s-env/validate-classification.sh`** checks shape, allowed **`file_splits`** (**`http`** / **`valkey`** only), required non-empty **`map`** (sources exist in filtered **`from`** vars, unique targets, unique sources), rejects removed keys **`remap`** / **`aliases`**, target env group existence, **cycle detection** on the inherits graph, and (for **`http`** / **`valkey`**) required split buckets.

## Profiles

| Profile        | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dev`          | App `.env` / `.env.local` on the developer machine (**`merge-env --profile dev`**). **No** `dev.yaml` file — **`base.yaml`** only. **`db`** / **`valkey`** client literals default to **`localhost`/`5532`** and **`localhost`/`6479`** (host to Docker-published Postgres/Valkey). **`management-api`** inherits selected **`db.vars`** keys via **`map`**: **`DB_HOST`/`DB_PORT`**, **`DB_USER`**, **`DB_PASSWORD`**, app/management DB names and read/write role credentials. |
| `local_docker` | `infra/config/local/*.env` consumed by the Docker Compose stack.                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `local_k8s`    | Optional overrides for in-cluster DNS (e.g. sidecar backend URLs).                                                                                                                                                                                                                                                                                                                                                                                                               |
| `remote_k8s`   | GitOps render (`make alpha_env_render`); merged with per-env overrides from `dev/env-overrides/<env>/` (e.g. alpha, beta, prod).                                                                                                                                                                                                                                                                                                                                                 |

## Kind values (per key)

| Kind          | Meaning                                                                                                                                                                                  |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `literal`     | Injected as plain `env:` on Deployment; not emitted into ConfigMap/Secret by render.                                                                                                     |
| `config`      | Non-secret; emitted into ConfigMap when present in merged env.                                                                                                                           |
| `secret`      | Emitted into Secret when present in merged env.                                                                                                                                          |
| `source_only` | In merged env files for this env group but **not** emitted into that env group’s ConfigMap/Secret (e.g. **`DB_*_SOURCE_ONLY`** on **`db`**, **`VALKEY_*_SOURCE_ONLY`** on **`valkey`**). |

Env groups **`web`** and **`management-web`** set **`no_env_from: true`**: they only expose **literal** `RUNTIME_CONFIG_URL` to the Next.js process; the runtime-config sidecar holds the rest.

## `API_USER_AGENT` / `MANAGEMENT_API_USER_AGENT` (env groups `api`, `management-api`)

Outbound HTTP User-Agent strings per app. **Required** at runtime; defaults live in **`base.yaml`**. Format: **three slash-separated segments** (`BrandPart/Middle/Version`); the first segment must contain the substring **`Bot`**. Profile **`remote_k8s`** overrides defaults to **`Bot Production/...`** in [`infra/env/overrides/remote-k8s.yaml`](../../infra/env/overrides/remote-k8s.yaml). Both keys are **`user_agent`** anchors (optional overrides in **`user-agent.env`**); [`scripts/local-env/setup.sh`](../../scripts/local-env/setup.sh) applies them to the API and management-api env files (see [LOCAL-ENV-OVERRIDES.md](LOCAL-ENV-OVERRIDES.md)).

## `API_MESSAGES_TERMS_OF_SERVICE_URL` (env group `api`)

Required URL returned by the mbrss-v1 capability endpoint as `terms_of_service_url`. Set this to the
public web terms page (for example, `/terms` on the web domain). Local default is
`http://localhost:4002/terms`; `remote_k8s` provides `https://metaboost.cc/terms` as a portable
baseline and deployment-specific environments can override it in their GitOps env overlays.

## `API_EXCHANGE_RATES_FIAT_BASE_CURRENCY` / `API_EXCHANGE_RATES_FIAT_PROVIDER_URL` / `API_EXCHANGE_RATES_BTC_PROVIDER_URL` / `API_EXCHANGE_RATES_CACHE_TTL_MS` (env group `api`)

Exchange-rate provider settings used by API summary conversion logic:

- **`API_EXCHANGE_RATES_FIAT_BASE_CURRENCY`** — Base fiat code used to seed the rates map (default `USD`).
- **`API_EXCHANGE_RATES_FIAT_PROVIDER_URL`** — Fiat rates endpoint URL (default `https://api.frankfurter.app/latest?from=USD`).
- **`API_EXCHANGE_RATES_BTC_PROVIDER_URL`** — BTC pricing endpoint URL (default `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd`).
- **`API_EXCHANGE_RATES_CACHE_TTL_MS`** — In-memory cache TTL in milliseconds (default `600000`, i.e. 10 minutes).

These values are required by API runtime config; defaults are defined in classification and env artifacts rather than API code.

## `RSS_PARSE_MIN_INTERVAL_MS` (env group `api`)

Minimum elapsed time (milliseconds) before mbrss-v1 ingest will force an RSS reparse when an `item_guid`
lookup misses. Default is `600000` (10 minutes). This value is explicit in classification/env files
for clarity, even though API config also keeps the same runtime fallback.

## `STANDARD_ENDPOINT_REGISTRY_URL` / `STANDARD_ENDPOINT_REGISTRY_POLL_SECONDS` / `STANDARD_ENDPOINT_REGISTRY_TIMEOUT_MS` (env group `api`)

Standard Endpoint **app registry** base URL and fetch tuning (public JSON records for registered apps).

- **`STANDARD_ENDPOINT_REGISTRY_URL`** — Base URL with **no** trailing slash; app records resolve as `<base>/<app_id>.app.json`. Default **`https://raw.githubusercontent.com/podverse/metaboost-registry/main/registry/apps`** (Podverse Metaboost Registry on GitHub). Optional: if unset or empty, the default applies. If set, must be a valid **http** or **https** URL.
- **`STANDARD_ENDPOINT_REGISTRY_POLL_SECONDS`** — Positive number (default **`300`**), max **86400** when set. Intended for future background refresh of registry-backed data.
- **`STANDARD_ENDPOINT_REGISTRY_TIMEOUT_MS`** — Positive number (default **`10000`**), max **300000** when set. HTTP timeout when fetching registry documents.

Classification defaults live in [`infra/env/classification/base.yaml`](../../infra/env/classification/base.yaml). On startup the API logs the effective registry origin and path (host only; no credentials).

## `STANDARD_ENDPOINT_REQUIRE_HTTPS` / `STANDARD_ENDPOINT_TRUST_PROXY` (env group `api`)

HTTPS policy for **Standard Endpoint** routes (`/v1/standard/*`):

- **`STANDARD_ENDPOINT_REQUIRE_HTTPS`** — When empty or unset, enforcement follows **`NODE_ENV`**: on when **`production`**, otherwise HTTP is allowed (local dev and **`NODE_ENV=test`**). Set explicitly to **`true`**, **`false`**, **`1`**, **`0`**, **`yes`**, or **`no`** (case-insensitive) to override. When enforcement is on, cleartext requests are rejected at the app layer (**`403`**, body includes **`errorCode`** **`https_required`**).
- **`STANDARD_ENDPOINT_TRUST_PROXY`** — When **`true`**, the app trusts **`X-Forwarded-Proto`** (first comma-separated value) so TLS termination at Ingress or a load balancer is reflected in scheme checks. Default **`false`** in [`base.yaml`](../../infra/env/classification/base.yaml). Profile **`remote_k8s`** sets **`STANDARD_ENDPOINT_REQUIRE_HTTPS`** and **`STANDARD_ENDPOINT_TRUST_PROXY`** to **`true`** so cluster deployments honor ingress TLS; **`local_docker`** and **`local_k8s`** set both to **`false`** for plain HTTP inside the stack.

See [REMOTE-K8S-GITOPS.md](REMOTE-K8S-GITOPS.md) § Standard Endpoint (`/v1/standard/*`) HTTPS (app layer).

## `API_CORS_ORIGINS` / `MANAGEMENT_API_CORS_ORIGINS` (env groups `api`, `management-api`)

Comma-separated **browser `Origin`** values (include **`http://` or `https://`**—not host:port alone). **`API_CORS_ORIGINS`** on **`api`** is **`kind: literal`** under **`api.vars`** with the same local default as **`WEB_BASE_URL`** on **`http.web`** (**`http://localhost:4002`** in base); **`api`** still inherits **`WEB_BASE_URL`** from **`http`** for mailer/links. **`MANAGEMENT_API_CORS_ORIGINS`** on **`management-api`** is **`kind: literal`** under **`management-api.vars`** with the same local default as **`MANAGEMENT_WEB_BASE_URL`** on **`http.management-web`** (**`http://localhost:4102`** in base); **`management-api`** still inherits **`MANAGEMENT_WEB_BASE_URL`** from **`http`** alongside **`MANAGEMENT_API_CORS_ORIGINS`**. There is **no** **`cors.env`** home override: change the main API allowlist via **`api.vars.API_CORS_ORIGINS`** (classification overlays or per-env **`--extra-env`**), **`http.web`** **`WEB_BASE_URL`** for mailer/links, or both; management allowlist via **`management-api.vars.MANAGEMENT_API_CORS_ORIGINS`** (or overlays / **`--extra-env`**), with **`http.management-web`** **`MANAGEMENT_WEB_BASE_URL`** for management-web URLs. Profile **`remote_k8s`** clears **`WEB_BASE_URL`** / **`MANAGEMENT_WEB_BASE_URL`** under **`http.web`** / **`http.management-web`** and **`API_CORS_ORIGINS`** / **`MANAGEMENT_API_CORS_ORIGINS`** on the APIs to **empty** so GitOps merges do not ship localhost-only allowlists. **Empty** means permissive CORS for routes that use this allowlist (`origin: true` in Express when unset).

**Main API only:** routes under **`{API_VERSION_PATH}/standard/*`** (public Standard Endpoint, e.g. mbrss-v1) use **permissive CORS** in application code (reflect the request `Origin`) so third-party and cross-app browsers can call those endpoints regardless of **`API_CORS_ORIGINS`**. All other versioned routes (`/auth`, `/buckets`, etc.) use **`API_CORS_ORIGINS`** as above.

## `WEB_BASE_URL` / `MANAGEMENT_WEB_BASE_URL` (env group `http`)

**`WEB_BASE_URL`** — on **`http.web`** (**`literal`**); public base URL of the **main web app** (Next.js), used in transactional email and similar links when **`AUTH_MODE`** uses email flows. **`MANAGEMENT_WEB_BASE_URL`** — on **`http.management-web`** (**`literal`**); public base URL of **management-web** (default **`http://localhost:4102`**). **`api`** inherits **`from: http`** with **`file_splits: [api, web]`** (including **`WEB_BASE_URL`**) and defines **`API_CORS_ORIGINS`** under **`api.vars`**. **`management-api`** inherits **`MANAGEMENT_WEB_BASE_URL`** from **`http`** and defines **`MANAGEMENT_API_CORS_ORIGINS`** under **`management-api.vars`** (see **`API_CORS_ORIGINS` / `MANAGEMENT_API_CORS_ORIGINS`** above). **`web-sidecar`** and **`management-web-sidecar`** use **`map`** to expose **`WEB_BASE_URL`** as **`NEXT_PUBLIC_WEB_BASE_URL`**. Profile **`remote_k8s`** clears both via **`http.web`** / **`http.management-web`** overlays; set real URLs in env overrides for deployed environments.

## `WEB_BASE_URL` (env groups `http.web`, consumed by `management-api`)

Optional main web app base URL used by the management API (e.g. invitation links). Defined under **`http.web`** and inherited into **`management-api`** as `WEB_BASE_URL`.

## `API_JWT_ACCESS_EXPIRY_SECONDS` / `API_JWT_REFRESH_EXPIRY_SECONDS` / `API_SESSION_COOKIE_NAME` / `API_REFRESH_COOKIE_NAME` (env group `api`)

Main API session settings:

- `API_JWT_ACCESS_EXPIRY_SECONDS` — access token expiry (seconds).
- `API_JWT_REFRESH_EXPIRY_SECONDS` — refresh token expiry (seconds).
- `API_SESSION_COOKIE_NAME` — access/session cookie name.
- `API_REFRESH_COOKIE_NAME` — refresh cookie name.

All are required by API runtime config and should be set via classification/env rendering.

## `MANAGEMENT_API_JWT_ACCESS_EXPIRY_SECONDS` / `MANAGEMENT_API_JWT_REFRESH_EXPIRY_SECONDS` / `MANAGEMENT_API_SESSION_COOKIE_NAME` / `MANAGEMENT_API_REFRESH_COOKIE_NAME` (env group `management-api`)

Management API session settings mirroring the main API:

- `MANAGEMENT_API_JWT_ACCESS_EXPIRY_SECONDS`
- `MANAGEMENT_API_JWT_REFRESH_EXPIRY_SECONDS`
- `MANAGEMENT_API_SESSION_COOKIE_NAME`
- `MANAGEMENT_API_REFRESH_COOKIE_NAME`

All are required by management-api runtime config and should be set via classification/env rendering.

## `MANAGEMENT_API_USER_INVITATION_TTL_HOURS` (env group `management-api`)

TTL in hours for admin-created invitation / set-password links in management-api. This is required and must be a positive integer.

## `NEXT_PUBLIC_SESSION_REFRESH_INTERVAL_MS` / `NEXT_PUBLIC_MANAGEMENT_SESSION_REFRESH_INTERVAL_MS` (env groups `web-sidecar`, `management-web-sidecar`)

Session-refresh loop intervals used by web and management-web clients. These are delivered through sidecar runtime config and validated by the sidecars as required positive numbers.

## `NEXT_PUBLIC_API_PUBLIC_BASE_URL` / `NEXT_PUBLIC_API_VERSION_PATH` / `NEXT_PUBLIC_MANAGEMENT_API_PUBLIC_BASE_URL` / `NEXT_PUBLIC_MANAGEMENT_API_VERSION_PATH` (env groups `web-sidecar`, `management-web-sidecar`)

Browser-facing API origins and version paths consumed by Next.js apps via runtime-config sidecars. These are mapped from classification HTTP keys and exposed as `NEXT_PUBLIC_*` values in sidecar output.

## `NEXT_PUBLIC_DEFAULT_LOCALE` / `NEXT_PUBLIC_SUPPORTED_LOCALES`

Locale values served via runtime-config sidecars for web and management-web. They map from canonical `DEFAULT_LOCALE` / `SUPPORTED_LOCALES` anchors in env group `locale`.

## `API_COOKIE_DOMAIN` (env group `api`) / `MANAGEMENT_API_COOKIE_DOMAIN` (env group `management-api`)

Optional **`Set-Cookie` `Domain`** for session and refresh cookies. The main API uses **`API_COOKIE_DOMAIN`**; the management API uses **`MANAGEMENT_API_COOKIE_DOMAIN`**. **`base.yaml`** defaults to **`localhost`** for local dev; both apps **omit** the `Domain` attribute when the value is **`localhost`** (case-insensitive, trimmed), so cookies stay **host-only**—the behavior **`npm run dev:all`** needs. **Empty** is also treated as omit. **Non-empty** otherwise (e.g. **`.example.com`**): cookies are sent to subdomains for cross-subdomain auth when CORS/credentials are configured. Profile **`remote_k8s`** clears **`API_COOKIE_DOMAIN`** and **`MANAGEMENT_API_COOKIE_DOMAIN`** to **empty** so GitOps renders do not inherit **`localhost`**; set the real registrable domain (often a leading dot) in env overrides for deployed hosts. Use **HTTPS** and **`Secure`** cookies in production. **`SameSite`** is fixed to **`Lax`** in application code (not configurable via env).

## Override metadata (optional, orthogonal to `kind`)

Use these fields when a key participates in **`~/.config/metaboost/`** override flows (`local-env-overrides/` or `alpha-env-overrides/` via prepare/link) and fan-out in [`scripts/local-env/setup.sh`](../../scripts/local-env/setup.sh). They do **not** change merge or GitOps render behavior; [`scripts/k8s-env/validate-classification.sh`](../../scripts/k8s-env/validate-classification.sh) enforces consistency.

| Field           | Values                                                     | Meaning                                                                                                                                                                                                                                 |
| --------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `override_file` | Logical name (non-empty ⇒ home-override anchor)            | Maps to one home override file; see table below. Presence alone marks the key as an anchor (do not set `override_role: anchor`).                                                                                                        |
| `override_role` | `derived` or `none`                                        | `derived` = filled from another variable after overrides load (requires `derived_from`). `none` = explicit opt-out (must not combine with `override_file` or `derived_from`). **`anchor`** is invalid (redundant with `override_file`). |
| `derived_from`  | Variable name (required when `override_role` is `derived`) | Documents fan-out in [`scripts/local-env/setup.sh`](../../scripts/local-env/setup.sh) when not expressed purely by classification merge (rare). **`merge-env` ignores `derived_from`** and uses each key’s **`default`** only.          |

## `local_generator` (optional)

Use when a **`kind: secret`** is **filled or refreshed** by **`make local_env_setup`** (`setup.sh`), not by GitOps merge alone. Value: **`hex_32`** (`openssl rand -hex 32` / Node crypto; 256-bit entropy). Omitted for secrets that only come from overrides or manual edit (e.g. mailer credentials). **`API_JWT_SECRET`**, **`MANAGEMENT_API_JWT_SECRET`**, DB role passwords (including **`DB_MANAGEMENT_READ_WRITE_PASSWORD`**), **`VALKEY_PASSWORD`**, and related keys use the same generator. Env groups **`api`** and **`management-api`** use **`DB_APP_READ_PASSWORD`** / **`DB_APP_READ_WRITE_PASSWORD`** (same values as env group **`db`**, merged into **`infra/config/local/db.env`**).

**Logical override files** (filenames under `dev/env-overrides/local/`, `dev/env-overrides/alpha/`, and linked `~/.config/metaboost/` trees):

| `override_file` value     | File                          |
| ------------------------- | ----------------------------- |
| `info`                    | `info.env`                    |
| `mailer`                  | `mailer.env`                  |
| `auth`                    | `auth.env`                    |
| `locale`                  | `locale.env`                  |
| `user_agent`              | `user-agent.env`              |
| `db_management_superuser` | `db-management-superuser.env` |

## Postgres (`db`) vs split buckets (`valkey`)

**`env_groups.db`** uses a single top-level **`vars`** map (flat keys). **`DB_MANAGEMENT_SUPERUSER_USERNAME`** and **`DB_MANAGEMENT_SUPERUSER_PASSWORD`** live there with **`override_file: db_management_superuser`** (home stub **`db-management-superuser.env`**); they are **not** a separate nested YAML bucket. **Local Docker / k3d** use one **`infra/config/local/db.env`** from **`merge-env --profile local_docker --group db`**. Typical keys include **`DB_*_SOURCE_ONLY`**, **`DB_HOST`**, **`DB_PORT`**, **`DB_USER`**, **`DB_PASSWORD`**, app and management role names/passwords, and **`DB_MANAGEMENT_SUPERUSER_*`**.

**`env_groups.valkey`** uses **split bucket keys** at the env group root (no top-level **`vars`** on the env group itself). Each bucket is **`bucket-name: { vars: { VAR: { kind, default, … } } }`**. Bucket order in YAML defines flatten order for merge. Do **not** set per-var **`file_split`** (validator rejects it).

**Valkey** — `valkey-source-only` → `valkey-source-only.env`; `valkey` → `valkey.env`.

**HTTP** — Split buckets (**`api`**, **`web-sidecar`**, **`web`**, **`management-api`**, **`management-web-sidecar`**, **`management-web`**) group URL/port keys by consumer; merge flattens them in that order. There is no separate **`http*.env`** file—only **`inherits`** + **`file_splits`** pull selected buckets into consuming env groups.

The **`api`** env group (and Docker Compose `metaboost_local_api`) uses **`api.env`** plus **`db.env`** (merged Postgres-related keys from classification env group **`db`**).

## Env groups (summary)

Env groups appear in **`base.yaml`** in **dependency / bring-up order** (infra first, then main app stack, then management stack).

| Order | Env group                | Role                                                                                                                                                                                                                                                                                                 |
| ----- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | `db`                     | Postgres cluster + app DB + management DB roles; flat **`vars`** including **`DB_MANAGEMENT_SUPERUSER_*`** (**`override_file`**: `db_management_superuser` → **`db-management-superuser.env`**); local **`merge-env --profile local_docker --group db`** writes one **`infra/config/local/db.env`**. |
| 2     | `valkey`                 | Valkey password and client host/port metadata.                                                                                                                                                                                                                                                       |
| 3     | `auth`                   | **`AUTH_MODE`** anchor (`auth.env`); inherited by APIs and web-sidecar (**`map`** to **`NEXT_PUBLIC_AUTH_MODE`** on **`web-sidecar`**).                                                                                                                                                              |
| 4     | `info`                   | **`WEB_BRAND_NAME`**, **`MANAGEMENT_WEB_BRAND_NAME`** anchors (`info.env`); API + sidecars (**`map`** to **`NEXT_PUBLIC_*`** on sidecars where applicable).                                                                                                                                          |
| 5     | `locale`                 | Shared **`DEFAULT_LOCALE`** / **`SUPPORTED_LOCALES`** anchors (`locale.env`); inherited by **`api`**, **`management-api`**, and sidecars (identity or **`map`** to **`NEXT_PUBLIC_*`**).                                                                                                             |
| 6     | `mailer`                 | **`MAILER_*`** anchors (`mailer.env`); inherited by **`api`**. **`MAILER_USER`** / **`MAILER_PASSWORD`** are optional **together** for SMTP AUTH (both empty = no auth; both set = authenticated SMTP, e.g. Brevo).                                                                                  |
| 6a    | `http`                   | Split buckets (**`api`**, **`web-sidecar`**, **`web`**, **`management-api`**, **`management-web-sidecar`**, **`management-web`**) for URL/port keys by consumer; **`inherits`** use **`file_splits`** (see **HTTP** above). Virtual / inherit-only.                                                  |
| 7     | `api`                    | Main HTTP API.                                                                                                                                                                                                                                                                                       |
| 8     | `web-sidecar`            | Serves runtime config JSON for web.                                                                                                                                                                                                                                                                  |
| 9     | `web`                    | Next.js web app; only `RUNTIME_CONFIG_URL` in process env when using sidecar.                                                                                                                                                                                                                        |
| 10    | `management-api`         | Management HTTP API.                                                                                                                                                                                                                                                                                 |
| 11    | `management-web-sidecar` | Serves runtime config JSON for management-web.                                                                                                                                                                                                                                                       |
| 12    | `management-web`         | Next.js management app; only `RUNTIME_CONFIG_URL` in process env when using sidecar.                                                                                                                                                                                                                 |

## CLI

From repo root:

```bash
ruby scripts/env-classification/metaboost-env.rb merge-env --profile dev --group api
ruby scripts/env-classification/metaboost-env.rb merge-env --profile local_docker --group api --output /tmp/api.env
ruby scripts/env-classification/metaboost-env.rb merge-env --profile local_docker --group db --output infra/config/local/db.env
```

Parity smoke test (all profiles × env groups):

```bash
bash scripts/env-classification/validate-parity.sh
```

## See also

- [LOCAL-ENV-OVERRIDES.md](LOCAL-ENV-OVERRIDES.md) — Home overrides and `make local_env_setup`.
- [K8S-ENV-RENDER.md](K8S-ENV-RENDER.md) — GitOps render and drift validation.
