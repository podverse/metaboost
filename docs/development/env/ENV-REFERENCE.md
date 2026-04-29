# Environment variables (source-of-truth contract)

Metaboost contributor-facing env source-of-truth files are:

- **App templates/examples:** **`apps/*/.env.example`** and **`apps/*/sidecar/.env.example`**.
- **Infra workload templates/examples:** **`infra/config/env-templates/*.env.example`**.

Runtime merge behavior is defined by template-driven scripts and profile overlays.

The generated [**ENV-VARS-REFERENCE.md**](ENV-VARS-REFERENCE.md) lists every variable by env group with **`local_docker`** vs **`remote_k8s`** defaults and K8s placement; update it after env template/contract changes.

For cross-repo file-by-file contract mapping, see [**ENV-SOURCE-OF-TRUTH-PARITY.md**](ENV-SOURCE-OF-TRUTH-PARITY.md).

Env docs are template-first: use `.env.example` files for canonical ordering, keys, and comments. Merge/render internals may evolve, but contributor-facing defaults and expected keys remain anchored to templates plus environment override files.

## Merge order

1. **Canonical templates/examples** — Defaults aligned with local dev and remote-k8s contract expectations.
2. **Runtime contract defaults** — Script-level defaults for profile-specific render paths (local, local_docker, remote_k8s).
3. **`dev/env-overrides/<env>/*.env`** and optional GitOps `apps/metaboost-<env>/env/remote-k8s.env` — Last-wins deployment overrides.
4. **Generated secrets (local only)** — After merged env files exist, **`scripts/local-env/setup.sh`** runs `first_non_empty_or_generate` so existing non-empty values survive across runs; otherwise it generates new material. Keys that participate are tagged in **`base.yaml`** with **`local_generator`** (`hex_32`). Implementation lives in **`setup.sh`** (`generate_hex_32`); keep that script aligned with **`local_generator`** when adding or renaming secrets.

5. **Generated secrets (remote GitOps tooling)** — for remote clusters, any secret generation/encryption workflow is owned by your GitOps repository. Keep generated/encrypted secret handling there, not in this repository.

**Local sidecar paths:** **`infra/config/local/*-sidecar.env`** is **`merge-env --profile local_docker`** for Compose only. **`apps/*/sidecar/.env`** is **`merge-env --profile dev`** for host CLI sidecars (same profile as **`apps/web/.env.local`**); it is not derived by copying the infra sidecar files.

**Key order in output:** Generated `.env` files, home override stubs, and Kubernetes ConfigMap **`data`** / Secret **`stringData`** follow **effective** var order: inherited keys first (see **Env group inherits**), then keys from the env group’s own **`vars`** (or flattened split-bucket order for **`http`** and **`valkey`**) so overrides appear at the end. Keys supplied only via **`--extra-env`** files and not present in the effective spec are appended afterward in the order they appear in those files.

## Env group inherits (optional)

An env group may list **`inherits`** as an **ordered array** of mappings next to **`vars`**. Each entry has:

- **`from`** — Name of another env group under **`env_groups`** (e.g. **`valkey`**, **`db`**). Resolution is **shallow**: only that env group’s own **`vars`** are copied (**`http`** and **`valkey`**: vars flattened from split buckets in order; **`db`** and other env groups: top-level **`vars`** only; transitive inherits on the source are not expanded).
- **`file_splits`** — Optional; **only when `from` is `http` or `valkey`**. If omitted (or null), **all** keys from that source (all split buckets) are eligible for **`map`** source names. If set to a non-empty array, only keys under the listed **split bucket names** are included (**`http`**: **`api`**, **`web-sidecar`**, **`web`**, **`management-api`**, **`management-web-sidecar`**, **`management-web`**; valkey: **`valkey-source-only`**, **`valkey`**). An explicit empty array **`file_splits: []`** includes **no** keys from that inherit entry. **`api`** / **`management-api`** use **`file_splits: [valkey]`** so **`KEYVALDB_*_SOURCE_ONLY`** stay on the valkey env group / source-only file only. Env group **`db`** has no split buckets; **`from: db`** inherits use **`map`** only (all **`db.vars`** keys are available as sources).
- **`map`** — **Required** on every inherit entry (with **`from`**): a non-empty mapping **source var name → target var name** on the **inheriting** env group. **Only** keys listed in **`map`** are imported; there is no implicit pass-through. **Identity** uses the same name twice (e.g. **`DEFAULT_LOCALE: DEFAULT_LOCALE`**). **Rename** lists the source on the left and the consuming name on the right (e.g. **`DEFAULT_LOCALE: NEXT_PUBLIC_DEFAULT_LOCALE`** on **`web-sidecar`**). Every **source** key must exist in the filtered **`from`** vars (respecting **`file_splits`**). **`override_role`**, **`override_file`**, and **`derived_from`** are **stripped** when source ≠ target so **`locale.env`** / **`auth.env`** stubs stay keyed by canonical names on the source env group. Targets whose name starts with **`NEXT_PUBLIC_`** get **`kind: config`** when the source was **`literal`**, so GitOps render still emits them into the sidecar ConfigMap. Duplicate source keys or duplicate targets in the same **`map`** are invalid.

**Precedence:** Later inherit entries **replace** earlier ones on the same key. Keys in the env group’s own **`vars`** are merged on top (**`merge-env`** uses **`merge_var_specs`**, so nested fields on a spec can deep-merge). For a full override of a key, redefine it under **`vars`**.

**Consumers:** **`flatten_env_group_env`**, **`reorder_env_map_to_group_vars`**, **`derive_render_buckets`**, and **`render_k8s_env.rb`** all use the **effective** var spec map (inherits + own **`vars`** or flattened split buckets), so **`kind`** and CM/Secret routing stay correct for inherited keys. Env groups **`api`**, **`management-api`**, and **`web-sidecar`** inherit **`from: auth`** for **`ACCOUNT_SIGNUP_MODE`** (single definition in env group **`auth`**). Env groups **`api`** and **`management-api`** also inherit **`locale`**, **`valkey`** with **`file_splits: [valkey]`**, and **`from: db`** with an explicit **`map`** for each imported **`DB_*`** key. **`base.yaml`** defines host client literals (**`localhost`**, **`5532`**, **`6479`**); **`local-docker`**, **`local_k8s`**, and **`remote_k8s`** overlays override **`db.vars`** and **`valkey.valkey.vars`** for in-cluster / Compose service DNS and container ports. Env group **`api`** also inherits **`from: mailer`** for **`MAILER_*`** (see **Mailer** below), **`from: http`** with **`file_splits: [api, web]`** and an explicit **`map`** for every imported key (**`WEB_BASE_URL`**, **`WEB_PORT`**, main API URLs). **`API_CORS_ORIGINS`** is **`api.vars`** (**`literal`**; local default matches **`http.web`** **`WEB_BASE_URL`**; no home-override file). **`web-sidecar`** inherits **`from: http`** with **`file_splits: [api, web, web-sidecar]`** and **`map`** entries that rename **`API_VERSION_PATH`**, **`API_PUBLIC_BASE_URL`**, and **`WEB_BASE_URL`** to **`NEXT_PUBLIC_*`** while listing **`API_PORT`**, **`API_SERVER_BASE_URL`**, **`WEB_PORT`**, and **`WEB_SIDECAR_PORT`** with identity (**`X: X`**). **`web`** and **`management-web`** inherit **`from: http`** with **`file_splits: [web]`** / **`[management-web]`** and **`map`** for **`WEB_BASE_URL`** / **`WEB_PORT`** or **`MANAGEMENT_WEB_*`** (alongside literal **`RUNTIME_CONFIG_URL`**). **`management-api`** inherits **`from: http`** with **`file_splits: [api, web, management-api, management-web]`** and **`map`** including **`API_VERSION_PATH: MANAGEMENT_API_VERSION_PATH`** plus identity for the other HTTP keys; **`MANAGEMENT_API_CORS_ORIGINS`** is **`management-api.vars`** (**`literal`**; local default matches **`http.management-web`** **`MANAGEMENT_WEB_BASE_URL`**; no home-override file). **`management-web-sidecar`** inherits **`from: http`** with **`file_splits: [api, web, management-api, management-web-sidecar]`** and **`map`** that renames **`API_VERSION_PATH`**, **`WEB_BASE_URL`**, and **`MANAGEMENT_API_PUBLIC_BASE_URL`** to **`NEXT_PUBLIC_*`** while listing the remaining keys with identity.

**Locale:** Env group **`locale`** holds **`DEFAULT_LOCALE`** and **`SUPPORTED_LOCALES`** (**`override_file: locale`**). **`merge-env`** runs **`apply_locale_next_public_sync`** for sidecars so **`--extra-env`** files that only set canonical keys still refresh **`NEXT_PUBLIC_*`** after overlays.

**Auth:** Env group **`auth`** holds **`ACCOUNT_SIGNUP_MODE`** (**`override_file: auth`**). **`api`** and **`management-api`** inherit it with identity **`map`**; **`web-sidecar`** inherits with **`map`** **`ACCOUNT_SIGNUP_MODE: NEXT_PUBLIC_ACCOUNT_SIGNUP_MODE`**. **`merge-env`** runs **`apply_account_signup_mode_next_public_sync`** for **`web-sidecar`** so **`--extra-env`** files that set **`ACCOUNT_SIGNUP_MODE`** still refresh **`NEXT_PUBLIC_ACCOUNT_SIGNUP_MODE`** after overlays (same idea as locale).

**Info (display / legal identity / transactional email):** Env group **`info`** holds **`WEB_BRAND_NAME`**, **`LEGAL_NAME`**, and **`MANAGEMENT_WEB_BRAND_NAME`** (**`override_file: info`**). **`api`** inherits these with identity **`map`** (mailer uses **`WEB_BRAND_NAME`**, and API/web terms can reference **`LEGAL_NAME`**). **`web-sidecar`** inherits **`info`** with **`map`** entries for **`WEB_BRAND_NAME: NEXT_PUBLIC_WEB_BRAND_NAME`** and **`LEGAL_NAME: NEXT_PUBLIC_LEGAL_NAME`**; **`management-web-sidecar`** uses **`MANAGEMENT_WEB_BRAND_NAME: NEXT_PUBLIC_MANAGEMENT_WEB_BRAND_NAME`**. **`merge-env`** runs **`apply_info_next_public_sync`** so **`--extra-env`** files that set canonical keys still refresh sidecar **`NEXT_PUBLIC_*`** values after overlays.

**HTTP (split buckets by consumer):** Env group **`http`** is split by consumer bucket (no top-level **`vars`**). Buckets: **`api`** (**`API_PORT`**, **`API_VERSION_PATH`**, **`API_PUBLIC_BASE_URL`** and **`API_SERVER_BASE_URL`** as **`literal`**), **`web-sidecar`** (**`WEB_SIDECAR_PORT`**), **`web`** (**`WEB_BASE_URL`**, **`WEB_PORT`**), **`management-api`** (**`MANAGEMENT_API_PORT`**, **`MANAGEMENT_API_PUBLIC_BASE_URL`** and **`MANAGEMENT_API_SERVER_BASE_URL`** as **`literal`**), **`management-web-sidecar`** (**`MANAGEMENT_WEB_SIDECAR_PORT`**), **`management-web`** (**`MANAGEMENT_WEB_BASE_URL`**, **`MANAGEMENT_WEB_PORT`**). **`api`** uses **`file_splits: [api, web]`** and lists every imported key in **`map`**; **`API_CORS_ORIGINS`** is on **`api.vars`**, not on env group **`http`**. **`web-sidecar`** uses **`[api, web, web-sidecar]`** with a full **`map`**. **`management-api`** uses **`[api, web, management-api, management-web]`**; **`MANAGEMENT_API_CORS_ORIGINS`** is on **`management-api.vars`**, not on env group **`http`**. **`management-web-sidecar`** uses **`[api, web, management-api, management-web-sidecar]`**; **`MANAGEMENT_WEB_SIDECAR_PORT`** is the sidecar listen port (same name in merged env). Env group **`http`** is **inherit-only** (not a GitOps render target as its own ConfigMap). Profile **`local_docker`** overrides **`API_SERVER_BASE_URL`** under **`env_groups.http.api.vars`** and **`MANAGEMENT_API_SERVER_BASE_URL`** under **`env_groups.http.management-api.vars`**. Profile **`remote_k8s`** clears **`WEB_BASE_URL`** under **`http.web`** and **`MANAGEMENT_WEB_BASE_URL`** under **`http.management-web`**. **Postgres (K8s):** The official image reads **`DB_APP_NAME`** for the initial database name; that value is the same as **`DB_APP_NAME`** in env defaults. GitOps and local stack deployments set **`DB_APP_NAME`** via **`secretKeyRef`** → **`DB_APP_NAME`** on **`metaboost-db-secrets`** (no separate **`POSTGRES_*`** keys in env defaults). Management database creation uses **`DB_MANAGEMENT_NAME`** in init scripts and env patches, not **`DB_MANAGEMENT_NAME`**.

**Mailer:** Env group **`mailer`** holds **`MAILER_*`** (**`override_file: mailer`**); every key uses **`kind: secret`** so GitOps render routes the whole set to the API **Secret** (not ConfigMap). **`MAILER_*` secrets are optional by default** and are only required when **`ACCOUNT_SIGNUP_MODE`** uses email flows (`admin_only_email` or `user_signup_email`). **`MAILER_USERNAME`** and **`MAILER_PASSWORD`** are optional as a pair: set both for SMTP AUTH or leave both empty. Only **`api`** consumes mail today; it inherits **`from: mailer`** so another env group can reuse the same block by adding **`inherits: - from: mailer`** (or a future transitive chain) without duplicating YAML. The API uses Nodemailer with default **`secure: false`**: the connection uses **STARTTLS** when the SMTP server advertises it (e.g. submission port **587**). **Port 465** (implicit TLS / SMTPS) is **not** supported without adding transport options (e.g. **`secure: true`**) in code.

**Validation:** validate remote env/manifests in your GitOps repository workflow (for example, `kubectl kustomize` plus your CI checks).

## Profiles

| Profile        | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dev`          | App `.env` / `.env.local` on the developer machine (**`merge-env --profile dev`**). **No** `dev.yaml` file — **`base.yaml`** only. **`db`** / **`valkey`** client literals default to **`localhost`/`5532`** and **`localhost`/`6479`** (host to Docker-published Postgres/Valkey). **`management-api`** inherits selected **`db.vars`** keys via **`map`**: **`DB_HOST`/`DB_PORT`**, **`DB_APP_ADMIN_USER`**, **`DB_APP_ADMIN_PASSWORD`**, app/management DB names and read/write role credentials. |
| `local_docker` | `infra/config/local/*.env` consumed by the Docker Compose stack.                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `local_k8s`    | Optional overrides for in-cluster DNS (e.g. sidecar backend URLs).                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `remote_k8s`   | Remote GitOps-oriented profile; merged with per-env overrides from `dev/env-overrides/<env>/` (e.g. alpha, beta, prod).                                                                                                                                                                                                                                                                                                                                                                              |

## Kind values (per key)

| Kind          | Meaning                                                                                                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `literal`     | Injected as plain `env:` on Deployment; not emitted into ConfigMap/Secret by render.                                                                                                       |
| `config`      | Non-secret; emitted into ConfigMap when present in merged env.                                                                                                                             |
| `secret`      | Emitted into Secret when present in merged env.                                                                                                                                            |
| `source_only` | In merged env files for this env group but **not** emitted into that env group’s ConfigMap/Secret (e.g. **`DB_*_SOURCE_ONLY`** on **`db`**, **`KEYVALDB_*_SOURCE_ONLY`** on **`valkey`**). |

Env groups **`web`** and **`management-web`** set **`no_env_from: true`**: they only expose **literal** `RUNTIME_CONFIG_URL` to the Next.js process; the runtime-config sidecar holds the rest.

## Runtime config lifecycle (web + management-web)

Both Next.js apps use the same runtime-config flow:

1. `instrumentation.ts` prewarms runtime config once per server process when `RUNTIME_CONFIG_URL` is set.
2. Root layout fetches sidecar runtime config and calls `setRuntimeConfig(...)` before rendering.
3. Root layout injects `RuntimeConfigScript` so the browser receives the same runtime snapshot.
4. `getRuntimeConfig()` falls back to `process.env` when sidecar config is not available in the current process (common in local dev workers or explicit non-sidecar runs).

This keeps local CLI (`localhost` sidecar URLs) and local Docker/K8s (service-DNS sidecar URLs) behavior consistent while avoiding build-time coupling to `NEXT_PUBLIC_*` app-process env vars.

## `API_USER_AGENT` / `MANAGEMENT_API_USER_AGENT` (env groups `api`, `management-api`)

Outbound HTTP User-Agent strings per app. **Required** at runtime; defaults live in the template/contract defaults. Format: **three slash-separated segments** (`BrandPart/Middle/Version`); the first segment must contain the substring **`Bot`**. Profile **`remote_k8s`** defaults use a production-style value and can be overridden through env overlays. Both keys are **`user_agent`** anchors (optional overrides in **`user-agent.env`**); [`scripts/local-env/setup.sh`](../../scripts/local-env/setup.sh) applies them to the API and management-api env files (see [LOCAL-ENV-OVERRIDES.md](LOCAL-ENV-OVERRIDES.md)).

## `API_MESSAGES_TERMS_OF_SERVICE_URL` (env group `api`)

Required URL returned by the mbrss-v1 capability endpoint as `terms_of_service_url`. Set this to the
public web terms page (for example, `/terms` on the web domain). Local default is
`http://localhost:4002/terms`; `remote_k8s` provides `https://metaboost.cc/terms` as a portable
baseline and deployment-specific environments can override it in their GitOps env overlays.

## `API_EXCHANGE_RATES_FIAT_BASE_CURRENCY` / `API_EXCHANGE_RATES_FIAT_PROVIDER_URL` / `API_EXCHANGE_RATES_BTC_PROVIDER_URL` / `API_EXCHANGE_RATES_CACHE_TTL_MS` / `API_EXCHANGE_RATES_MAX_STALE_MS` / `API_EXCHANGE_RATES_SERVER_STANDARD_CURRENCY` (env group `api`)

Exchange-rate provider settings used by API summary conversion logic:

- **`API_EXCHANGE_RATES_FIAT_BASE_CURRENCY`** — Base fiat code used to seed the rates map (default `USD`).
- **`API_EXCHANGE_RATES_FIAT_PROVIDER_URL`** — Optional fiat rates endpoint URL (default `https://api.frankfurter.app/latest?from=USD`).
- **`API_EXCHANGE_RATES_BTC_PROVIDER_URL`** — Optional BTC pricing endpoint URL (default `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd`).
- **`API_EXCHANGE_RATES_CACHE_TTL_MS`** — In-memory cache TTL in milliseconds (default `600000`, i.e. 10 minutes).
- **`API_EXCHANGE_RATES_MAX_STALE_MS`** — Maximum stale-cache age for fallback responses in milliseconds (default `1800000`, i.e. 30 minutes).
- **`API_EXCHANGE_RATES_SERVER_STANDARD_CURRENCY`** — Server-wide baseline conversion currency (default `USD`, must be one of the supported currency codes).
- **`API_EXCHANGE_RATES_FETCH_ENABLED`** — Optional; when unset or empty, exchange fetches default **on**. Set to **`false`** / **`0`** / **`no`** to disable outbound Frankfurter/CoinGecko calls. Even when this resolves true, exchange-rate features are disabled unless both provider URLs are non-empty.
- **`API_EXCHANGE_RATES_EXTRA_HOSTS`** — Optional comma-separated hostname allowlist extension for **`API_EXCHANGE_RATES_FIAT_PROVIDER_URL`** and **`API_EXCHANGE_RATES_BTC_PROVIDER_URL`** when fetch is enabled. Defaults pin Frankfurter + CoinGecko; startup validation fails if a configured provider URL’s host is outside the default set plus extras.

`API_EXCHANGE_RATES_FIAT_PROVIDER_URL` and `API_EXCHANGE_RATES_BTC_PROVIDER_URL` are optional runtime inputs. When either is missing, API startup still succeeds and exchange-rate-dependent features are unavailable.

## `RSS_PARSE_MIN_INTERVAL_MS` (env group `api`)

Minimum elapsed time (milliseconds) before mbrss-v1 ingest will force an RSS reparse when an `item_guid`
lookup misses. Default is `600000` (10 minutes). This value is explicit in environment template/env files
for clarity, even though API config also keeps the same runtime fallback.

## `API_RSS_FEED_MAX_BODY_BYTES` (env group `api`)

Maximum XML body size (bytes) when fetching **user-supplied** RSS feed URLs (bucket RSS verify/sync and RSS channel creation). Optional; default **`3000000`** (3 MiB). Must be between **`1000`** and **`50000000`** when set. Responses larger than this limit fail the fetch at the API layer.

## `STANDARD_ENDPOINT_REGISTRY_URL` / `STANDARD_ENDPOINT_REGISTRY_POLL_SECONDS` / `STANDARD_ENDPOINT_REGISTRY_TIMEOUT_MS` (env group `api`)

Standard Endpoint **app registry** base URL and fetch tuning (public JSON records for registered apps).

- **`STANDARD_ENDPOINT_REGISTRY_URL`** — Base URL with **no** trailing slash; app records resolve as `<base>/<app_id>.app.json`. Default **`https://raw.githubusercontent.com/v4v-io/metaboost-registry/main/registry/apps`** ([v4v-io/metaboost-registry](https://github.com/v4v-io/metaboost-registry) on GitHub). Optional: if unset or empty, the default applies. If set, must be a valid **http** or **https** URL.
- **`STANDARD_ENDPOINT_REGISTRY_POLL_SECONDS`** — Positive number (default **`300`**), max **86400** when set. Intended for future background refresh of registry-backed data.
- **`STANDARD_ENDPOINT_REGISTRY_TIMEOUT_MS`** — Positive number (default **`10000`**), max **300000** when set. HTTP timeout when fetching registry documents.
- **`STANDARD_ENDPOINT_REGISTRY_EXTRA_HOSTS`** — Optional comma-separated extra hostnames allowed for **`STANDARD_ENDPOINT_REGISTRY_URL`** (defaults allow GitHub raw hosts for the bundled registry). Use for self-hosted mirrors; startup validation rejects registry URLs whose host is not in the default set plus extras.

Defaults come from canonical templates plus runtime contract defaults. On startup the API logs the effective registry origin and path (host only; no credentials).

## `STANDARD_ENDPOINT_REQUIRE_HTTPS` / `STANDARD_ENDPOINT_TRUST_PROXY` (env group `api`)

HTTPS policy for **Standard Endpoint** routes (`/v1/standard/*`):

- **`STANDARD_ENDPOINT_REQUIRE_HTTPS`** — When empty or unset, enforcement follows **`NODE_ENV`**: on when **`production`**, otherwise HTTP is allowed (local dev and **`NODE_ENV=test`**). Set explicitly to **`true`**, **`false`**, **`1`**, **`0`**, **`yes`**, or **`no`** (case-insensitive) to override. When enforcement is on, cleartext requests are rejected at the app layer (**`403`**, body includes **`errorCode`** **`https_required`**).
- **`STANDARD_ENDPOINT_TRUST_PROXY`** — When **`true`**, the app trusts **`X-Forwarded-Proto`** (first comma-separated value) so TLS termination at Ingress or a load balancer is reflected in scheme checks. Profile **`remote_k8s`** sets **`STANDARD_ENDPOINT_REQUIRE_HTTPS`** and **`STANDARD_ENDPOINT_TRUST_PROXY`** to **`true`** so cluster deployments honor ingress TLS; **`local_docker`** and **`local_k8s`** set both to **`false`** for plain HTTP inside the stack.
- **Unsafe combination** — Startup validation **fails** if **`STANDARD_ENDPOINT_TRUST_PROXY=true`** together with **`STANDARD_ENDPOINT_REQUIRE_HTTPS=false`** (explicit). That pairing would let clients spoof **`X-Forwarded-Proto: https`** on cleartext hops.

See [REMOTE-K8S-GITOPS.md](../k8s/REMOTE-K8S-GITOPS.md) § Standard Endpoint (`/v1/standard/*`) HTTPS (app layer).

## `API_CORS_ORIGINS` / `MANAGEMENT_API_CORS_ORIGINS` (env groups `api`, `management-api`)

Comma-separated **browser `Origin`** values (include **`http://` or `https://`**—not host:port alone). **`API_CORS_ORIGINS`** on **`api`** is **`kind: literal`** under **`api.vars`** with the same local default as **`WEB_BASE_URL`** on **`http.web`** (**`http://localhost:4002`** in base); **`api`** still inherits **`WEB_BASE_URL`** from **`http`** for mailer/links. **`MANAGEMENT_API_CORS_ORIGINS`** on **`management-api`** is **`kind: literal`** under **`management-api.vars`** with the same local default as **`MANAGEMENT_WEB_BASE_URL`** on **`http.management-web`** (**`http://localhost:4102`** in base); **`management-api`** still inherits **`MANAGEMENT_WEB_BASE_URL`** from **`http`** alongside **`MANAGEMENT_API_CORS_ORIGINS`**. There is **no** **`cors.env`** home override: change the main API allowlist via **`api.vars.API_CORS_ORIGINS`** (env overlays or per-env **`--extra-env`**), **`http.web`** **`WEB_BASE_URL`** for mailer/links, or both; management allowlist via **`management-api.vars.MANAGEMENT_API_CORS_ORIGINS`** (or overlays / **`--extra-env`**), with **`http.management-web`** **`MANAGEMENT_WEB_BASE_URL`** for management-web URLs. Profile **`remote_k8s`** clears **`WEB_BASE_URL`** / **`MANAGEMENT_WEB_BASE_URL`** under **`http.web`** / **`http.management-web`** and **`API_CORS_ORIGINS`** / **`MANAGEMENT_API_CORS_ORIGINS`** on the APIs to **empty** so GitOps merges do not ship localhost-only allowlists — **deployment env must supply non-empty values** because both APIs **fail startup** when **`NODE_ENV`** is neither **`development`** nor **`test`** and these allowlists are missing or empty (so production-like deployments cannot silently fall back to permissive browser CORS). **`NODE_ENV=development`** or **`NODE_ENV=test`** still allows permissive fallback when unset (same as **`origin: true`** in Express when unset).

**Main API only:** routes under **`{API_VERSION_PATH}/standard/*`** (public Standard Endpoint, e.g. mbrss-v1) use **permissive CORS** in application code (reflect the request `Origin`) so third-party and cross-app browsers can call those endpoints regardless of **`API_CORS_ORIGINS`**. All other versioned routes (`/auth`, `/buckets`, etc.) use **`API_CORS_ORIGINS`** as above.

## `WEB_BASE_URL` / `MANAGEMENT_WEB_BASE_URL` (env group `http`)

**`WEB_BASE_URL`** — on **`http.web`** (**`literal`**); public base URL of the **main web app** (Next.js), used in transactional email and similar links when **`ACCOUNT_SIGNUP_MODE`** uses email flows. **`MANAGEMENT_WEB_BASE_URL`** — on **`http.management-web`** (**`literal`**); public base URL of **management-web** (default **`http://localhost:4102`**). **`api`** inherits **`from: http`** with **`file_splits: [api, web]`** (including **`WEB_BASE_URL`**) and defines **`API_CORS_ORIGINS`** under **`api.vars`**. **`management-api`** inherits **`MANAGEMENT_WEB_BASE_URL`** from **`http`** and defines **`MANAGEMENT_API_CORS_ORIGINS`** under **`management-api.vars`** (see **`API_CORS_ORIGINS` / `MANAGEMENT_API_CORS_ORIGINS`** above). **`web-sidecar`** and **`management-web-sidecar`** use **`map`** to expose **`WEB_BASE_URL`** as **`NEXT_PUBLIC_WEB_BASE_URL`**. Profile **`remote_k8s`** clears both via **`http.web`** / **`http.management-web`** overlays; set real URLs in env overrides for deployed environments.

## `WEB_BASE_URL` (env groups `http.web`, consumed by `management-api`)

Optional main web app base URL used by the management API (e.g. invitation links). Defined under **`http.web`** and inherited into **`management-api`** as `WEB_BASE_URL`.

## `API_JWT_ACCESS_EXPIRATION` / `API_JWT_REFRESH_EXPIRATION` / `API_SESSION_COOKIE_NAME` / `API_REFRESH_COOKIE_NAME` (env group `api`)

Main API session settings:

- `API_JWT_ACCESS_EXPIRATION` — access token expiry (seconds).
- `API_JWT_REFRESH_EXPIRATION` — refresh token expiry (seconds).
- `API_SESSION_COOKIE_NAME` — access/session cookie name.
- `API_REFRESH_COOKIE_NAME` — refresh cookie name.
- **`API_JWT_ISSUER`** / **`API_JWT_AUDIENCE`** — Optional JWT **`iss`** / **`aud`** claims for API access tokens. When either is set (non-empty after trim), newly issued tokens include the configured claims and verification requires them. Leave unset until tokens can be rotated across all clients.

All are required by API runtime config and should be set via environment template/env rendering.

## `API_AUTH_RATE_LIMIT_USE_KEYVALDB` (env group `api`)

When **`true`**, auth rate-limit counters (login, signup, refresh, etc.) use Valkey via **`rate-limit-redis`** so multiple API replicas share the same limits. Requires working **`KEYVALDB_*`** configuration merged into the API env (same client as other API Valkey usage). Default off (in-memory store per process).

## `MANAGEMENT_API_JWT_ACCESS_EXPIRATION` / `MANAGEMENT_API_JWT_REFRESH_EXPIRATION` / `MANAGEMENT_API_SESSION_COOKIE_NAME` / `MANAGEMENT_API_REFRESH_COOKIE_NAME` (env group `management-api`)

Management API session settings mirroring the main API:

- `MANAGEMENT_API_JWT_ACCESS_EXPIRATION`
- `MANAGEMENT_API_JWT_REFRESH_EXPIRATION`
- `MANAGEMENT_API_SESSION_COOKIE_NAME`
- `MANAGEMENT_API_REFRESH_COOKIE_NAME`
- **`MANAGEMENT_API_JWT_ISSUER`** / **`MANAGEMENT_API_JWT_AUDIENCE`** — Optional JWT **`iss`** / **`aud`** for management access tokens (same rollout semantics as **`API_JWT_*`** on the main API).

All are required by management-api runtime config and should be set via environment template/env rendering.

## `MANAGEMENT_API_AUTH_RATE_LIMIT_USE_KEYVALDB` (env group `management-api`)

When **`true`**, management-api auth rate-limit counters use Valkey (**`rate-limit-redis`**) for shared limits across replicas. Requires **`KEYVALDB_*`** merged into management-api env.

## `MANAGEMENT_API_USER_INVITATION_EXPIRATION` (env group `management-api`)

TTL in seconds for admin-created invitation / set-password links in management-api. This is required and must be a positive integer.

## `NEXT_PUBLIC_SESSION_REFRESH_INTERVAL_MS` / `NEXT_PUBLIC_MANAGEMENT_SESSION_REFRESH_INTERVAL_MS` (env groups `web-sidecar`, `management-web-sidecar`)

Session-refresh loop intervals used by web and management-web clients. These are delivered through sidecar runtime config and validated by the sidecars as required positive numbers.

## `NEXT_PUBLIC_API_PUBLIC_BASE_URL` / `NEXT_PUBLIC_API_VERSION_PATH` / `NEXT_PUBLIC_MANAGEMENT_API_PUBLIC_BASE_URL` / `NEXT_PUBLIC_MANAGEMENT_API_VERSION_PATH` (env groups `web-sidecar`, `management-web-sidecar`)

Browser-facing API origins and version paths consumed by Next.js apps via runtime-config sidecars. These are mapped from shared HTTP keys and exposed as `NEXT_PUBLIC_*` values in sidecar output.

## `NEXT_PUBLIC_DEFAULT_LOCALE` / `NEXT_PUBLIC_SUPPORTED_LOCALES`

Locale values served via runtime-config sidecars for web and management-web. They map from canonical `DEFAULT_LOCALE` / `SUPPORTED_LOCALES` anchors in env group `locale`.

## `API_COOKIE_DOMAIN` (env group `api`) / `MANAGEMENT_API_COOKIE_DOMAIN` (env group `management-api`)

Optional **`Set-Cookie` `Domain`** for session and refresh cookies. The main API uses **`API_COOKIE_DOMAIN`**; the management API uses **`MANAGEMENT_API_COOKIE_DOMAIN`**. **`base.yaml`** defaults to **`localhost`** for local dev; both apps **omit** the `Domain` attribute when the value is **`localhost`** (case-insensitive, trimmed), so cookies stay **host-only**—the behavior **`npm run dev:all`** needs. **Empty** is also treated as omit. **Non-empty** otherwise (e.g. **`.example.com`**): cookies are sent to subdomains for cross-subdomain auth when CORS/credentials are configured. Profile **`remote_k8s`** clears **`API_COOKIE_DOMAIN`** and **`MANAGEMENT_API_COOKIE_DOMAIN`** to **empty** so GitOps renders do not inherit **`localhost`**; set the real registrable domain (often a leading dot) in env overrides for deployed hosts. Use **HTTPS** and **`Secure`** cookies in production. **`SameSite`** is fixed to **`Lax`** in application code (not configurable via env).

## Override metadata (optional, orthogonal to `kind`)

Use these fields when a key participates in **`~/.config/metaboost/`** local override flows and fan-out in [`scripts/local-env/setup.sh`](../../scripts/local-env/setup.sh). Remote GitOps handling is maintained outside this repository.

| Field           | Values                                                     | Meaning                                                                                                                                                                                                                                 |
| --------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `override_file` | Logical name (non-empty ⇒ home-override anchor)            | Maps to one home override file; see table below. Presence alone marks the key as an anchor (do not set `override_role: anchor`).                                                                                                        |
| `override_role` | `derived` or `none`                                        | `derived` = filled from another variable after overrides load (requires `derived_from`). `none` = explicit opt-out (must not combine with `override_file` or `derived_from`). **`anchor`** is invalid (redundant with `override_file`). |
| `derived_from`  | Variable name (required when `override_role` is `derived`) | Documents fan-out in [`scripts/local-env/setup.sh`](../../scripts/local-env/setup.sh) when not expressed purely by env merge (rare). **`merge-env` ignores `derived_from`** and uses each key’s **`default`** only.                     |

## `local_generator` (optional)

Use when a **`kind: secret`** is **filled or refreshed** by **`make local_env_setup`** (`setup.sh`), not by GitOps merge alone. Value: **`hex_32`** (`openssl rand -hex 32` / Node crypto; 256-bit entropy). Omitted for secrets that only come from overrides or manual edit (e.g. mailer credentials). **`API_JWT_SECRET`**, **`MANAGEMENT_API_JWT_SECRET`**, DB role passwords (including **`DB_MANAGEMENT_READ_WRITE_PASSWORD`**), **`KEYVALDB_PASSWORD`**, and related keys use the same generator. Env groups **`api`** and **`management-api`** use **`DB_APP_READ_PASSWORD`** / **`DB_APP_READ_WRITE_PASSWORD`** (same values as env group **`db`**, merged into **`infra/config/local/db.env`**).

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

**`env_groups.db`** uses a single top-level **`vars`** map (flat keys). **Local Docker / k3d** use one **`infra/config/local/db.env`** from **`merge-env --profile local_docker --group db`**. Typical keys include **`DB_*_SOURCE_ONLY`**, **`DB_HOST`**, **`DB_PORT`**, **`DB_APP_ADMIN_USER`**, **`DB_APP_ADMIN_PASSWORD`**, plus app and management role names/passwords.

**`env_groups.valkey`** uses **split bucket keys** at the env group root (no top-level **`vars`** on the env group itself). Each bucket is **`bucket-name: { vars: { VAR: { kind, default, … } } }`**. Bucket order in YAML defines flatten order for merge. Do **not** set per-var **`file_split`** (validator rejects it).

**Valkey** — `valkey-source-only` → `valkey-source-only.env`; `valkey` → `valkey.env`.

**HTTP** — Split buckets (**`api`**, **`web-sidecar`**, **`web`**, **`management-api`**, **`management-web-sidecar`**, **`management-web`**) group URL/port keys by consumer; merge flattens them in that order. There is no separate **`http*.env`** file—only **`inherits`** + **`file_splits`** pull selected buckets into consuming env groups.

The **`api`** env group (and Docker Compose `metaboost_local_api`) uses **`api.env`** plus **`db.env`** (merged Postgres-related keys from env group **`db`**).

## Env groups (summary)

Env groups appear in **`base.yaml`** in **dependency / bring-up order** (infra first, then main app stack, then management stack).

| Order | Env group                | Role                                                                                                                                                                                                                                                |
| ----- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | `db`                     | Postgres cluster + app DB + management DB roles; local **`merge-env --profile local_docker --group db`** writes one **`infra/config/local/db.env`**.                                                                                                |
| 2     | `valkey`                 | Valkey password and client host/port metadata.                                                                                                                                                                                                      |
| 3     | `auth`                   | **`ACCOUNT_SIGNUP_MODE`** anchor (`auth.env`); inherited by APIs and web-sidecar (**`map`** to **`NEXT_PUBLIC_ACCOUNT_SIGNUP_MODE`** on **`web-sidecar`**).                                                                                         |
| 4     | `info`                   | **`WEB_BRAND_NAME`**, **`LEGAL_NAME`**, **`MANAGEMENT_WEB_BRAND_NAME`** anchors (`info.env`); API + sidecars (**`map`** to **`NEXT_PUBLIC_*`** on sidecars where applicable).                                                                       |
| 5     | `locale`                 | Shared **`DEFAULT_LOCALE`** / **`SUPPORTED_LOCALES`** anchors (`locale.env`); inherited by **`api`**, **`management-api`**, and sidecars (identity or **`map`** to **`NEXT_PUBLIC_*`**).                                                            |
| 6     | `mailer`                 | **`MAILER_*`** anchors (`mailer.env`); inherited by **`api`**. **`MAILER_USERNAME`** / **`MAILER_PASSWORD`** are optional **together** for SMTP AUTH (both empty = no auth; both set = authenticated SMTP, e.g. Brevo).                             |
| 6a    | `http`                   | Split buckets (**`api`**, **`web-sidecar`**, **`web`**, **`management-api`**, **`management-web-sidecar`**, **`management-web`**) for URL/port keys by consumer; **`inherits`** use **`file_splits`** (see **HTTP** above). Virtual / inherit-only. |
| 7     | `api`                    | Main HTTP API.                                                                                                                                                                                                                                      |
| 8     | `web-sidecar`            | Serves runtime config JSON for web.                                                                                                                                                                                                                 |
| 9     | `web`                    | Next.js web app; only `RUNTIME_CONFIG_URL` in process env when using sidecar.                                                                                                                                                                       |
| 10    | `management-api`         | Management HTTP API.                                                                                                                                                                                                                                |
| 11    | `management-web-sidecar` | Serves runtime config JSON for management-web.                                                                                                                                                                                                      |
| 12    | `management-web`         | Next.js management app; only `RUNTIME_CONFIG_URL` in process env when using sidecar.                                                                                                                                                                |

## CLI

From repo root:

```bash
./scripts/nix/with-env make local_env_setup
```

## See also

- [LOCAL-ENV-OVERRIDES.md](LOCAL-ENV-OVERRIDES.md) — Home overrides and `make local_env_setup`.
- [K8S-ENV-RENDER.md](k8s/K8S-ENV-RENDER.md) — Deprecation note and current remote GitOps ownership model.
