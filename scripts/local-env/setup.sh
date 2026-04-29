#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

OVERRIDES_DIR="dev/env-overrides/local"

DB_ENV="infra/config/local/db.env"
KEYVALDB_SOURCE_ONLY_ENV="infra/config/local/valkey-source-only.env"
KEYVALDB_ENV="infra/config/local/valkey.env"
API_INFRA_ENV="infra/config/local/api.env"
WEB_INFRA_ENV="infra/config/local/web.env"
WEB_SIDECAR_INFRA_ENV="infra/config/local/web-sidecar.env"
MANAGEMENT_API_INFRA_ENV="infra/config/local/management-api.env"
MANAGEMENT_WEB_INFRA_ENV="infra/config/local/management-web.env"
MANAGEMENT_WEB_SIDECAR_INFRA_ENV="infra/config/local/management-web-sidecar.env"
API_APP_ENV="apps/api/.env"
WEB_APP_ENV="apps/web/.env.local"
MANAGEMENT_API_APP_ENV="apps/management-api/.env"
MANAGEMENT_WEB_APP_ENV="apps/management-web/.env.local"
WEB_SIDECAR_APP_ENV="apps/web/sidecar/.env"
MANAGEMENT_WEB_SIDECAR_APP_ENV="apps/management-web/sidecar/.env"

sync_missing_keys_from_template() {
  local target_file="$1"
  local template_file="$2"
  local line key

  [ -f "$target_file" ] || return 0
  [ -f "$template_file" ] || return 0

  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      '' | '#'*)
        continue
        ;;
    esac
    key="${line%%=*}"
    if ! grep -q -E "^${key}=" "$target_file" 2>/dev/null; then
      echo "$line" >>"$target_file"
    fi
  done <"$template_file"
}

ensure_env_file_from_template() {
  local output_file="$1"
  local template_file="$2"

  if [ -f "$output_file" ]; then
    sync_missing_keys_from_template "$output_file" "$template_file"
  else
    cp "$template_file" "$output_file"
  fi
}

write_valkey_split_from_template() {
  local template_file="$1"
  local source_only_out="$2"
  local valkey_out="$3"
  local source_tmp valkey_tmp

  source_tmp="$(mktemp)"
  valkey_tmp="$(mktemp)"

  grep -E '^KEYVALDB_[A-Z0-9_]*_SOURCE_ONLY=' "$template_file" >"$source_tmp" || true
  grep -E '^KEYVALDB_[A-Z0-9_]*=' "$template_file" | grep -Ev '_SOURCE_ONLY=' >"$valkey_tmp" || true

  if [ -f "$source_only_out" ]; then
    sync_missing_keys_from_template "$source_only_out" "$source_tmp"
  else
    cp "$source_tmp" "$source_only_out"
  fi

  if [ -f "$valkey_out" ]; then
    sync_missing_keys_from_template "$valkey_out" "$valkey_tmp"
  else
    cp "$valkey_tmp" "$valkey_out"
  fi

  rm -f "$source_tmp" "$valkey_tmp"
}

# Ensure all required env files exist (seed from canonical templates/examples when missing)
mkdir -p infra/config/local
ensure_env_file_from_template "$DB_ENV" "infra/config/env-templates/db.env.example"
write_valkey_split_from_template "infra/config/env-templates/keyvaldb.env.example" "$KEYVALDB_SOURCE_ONLY_ENV" "$KEYVALDB_ENV"
ensure_env_file_from_template "$API_INFRA_ENV" "infra/config/env-templates/api.env.example"
ensure_env_file_from_template "$WEB_SIDECAR_INFRA_ENV" "infra/config/env-templates/web-sidecar.env.example"
ensure_env_file_from_template "$WEB_INFRA_ENV" "infra/config/env-templates/web.env.example"
ensure_env_file_from_template "$MANAGEMENT_API_INFRA_ENV" "infra/config/env-templates/management-api.env.example"
ensure_env_file_from_template "$MANAGEMENT_WEB_SIDECAR_INFRA_ENV" "infra/config/env-templates/management-web-sidecar.env.example"
ensure_env_file_from_template "$MANAGEMENT_WEB_INFRA_ENV" "infra/config/env-templates/management-web.env.example"
ensure_env_file_from_template "$API_APP_ENV" "apps/api/.env.example"
ensure_env_file_from_template "$WEB_APP_ENV" "apps/web/.env.example"
ensure_env_file_from_template "$MANAGEMENT_API_APP_ENV" "apps/management-api/.env.example"
ensure_env_file_from_template "$MANAGEMENT_WEB_APP_ENV" "apps/management-web/.env.example"
mkdir -p apps/web/sidecar apps/management-web/sidecar
ensure_env_file_from_template "$WEB_SIDECAR_APP_ENV" "apps/web/sidecar/.env.example"
ensure_env_file_from_template "$MANAGEMENT_WEB_SIDECAR_APP_ENV" "apps/management-web/sidecar/.env.example"

# Helpers for applying override values (Podverse-style)
escape_sed_replacement() {
  printf '%s' "$1" | sed -e 's/[\/&]/\\&/g'
}

trim_quotes() {
  local value="$1"
  value="${value%\"}"
  value="${value#\"}"
  value="${value%\'}"
  value="${value#\'}"
  printf '%s' "$value"
}

get_var() {
  local file="$1" var="$2" line
  [ -f "$file" ] || return 0
  line="$(grep -E "^${var}=" "$file" 2>/dev/null | head -n 1 || true)"
  [ -n "$line" ] || return 0
  trim_quotes "${line#*=}"
}

upsert_var() {
  local file="$1" var="$2" value="${3-}" replacement
  [ -f "$file" ] || return 0
  if [ -z "$value" ]; then
    replacement="${var}="
  else
    replacement="${var}=\"$(escape_sed_replacement "$value")\""
  fi
  if grep -q -E "^${var}=" "$file" 2>/dev/null; then
    sed -i.bak "s|^${var}=.*|${replacement}|" "$file"
    rm -f "${file}.bak"
  else
    echo "$replacement" >>"$file"
  fi
}

# Podverse-style: try get_var on each file:var; if any non-empty return it; else run generator.
first_non_empty_or_generate() {
  local generator="$1"
  shift
  local pair file var current
  for pair in "$@"; do
    file="${pair%%:*}"
    var="${pair#*:}"
    current="$(get_var "$file" "$var")"
    if [ -n "$current" ]; then
      printf '%s' "$current"
      return 0
    fi
  done
  "$generator"
}

generate_hex_32() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 32 | tr -d '\n'
    return 0
  fi
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
}

load_overrides() {
  if [ -d "$OVERRIDES_DIR" ]; then
    for file in "$OVERRIDES_DIR"/*.env; do
      [ -f "$file" ] || continue
      set -a
      # shellcheck disable=SC1090
      . "$file"
      set +a
    done
  fi
}

apply_override() {
  local var="$1"
  shift
  local value="${!var:-}"
  local file
  [ -n "$value" ] || return 0
  for file in "$@"; do
    upsert_var "$file" "$var" "$value"
  done
}

# Load override files (from home dir via symlink or in-repo)
load_overrides

# Generate all secrets in setup.sh (hex_32 for all locally generated secrets; reuse existing only from canonical keys in authoritative files).
# Which keys are autogenerated is documented in canonical env templates and must stay aligned with env template local_generator behavior.
# API and management-api use different JWT secrets.
DB_APP_ADMIN_PASSWORD="$(first_non_empty_or_generate generate_hex_32 "$DB_ENV:DB_APP_ADMIN_PASSWORD")"
DB_APP_READ_PASSWORD="$(first_non_empty_or_generate generate_hex_32 "$DB_ENV:DB_APP_READ_PASSWORD")"
DB_APP_READ_WRITE_PASSWORD="$(first_non_empty_or_generate generate_hex_32 "$DB_ENV:DB_APP_READ_WRITE_PASSWORD")"
DB_MANAGEMENT_ADMIN_PASSWORD="$(first_non_empty_or_generate generate_hex_32 "$DB_ENV:DB_MANAGEMENT_ADMIN_PASSWORD")"
DB_MANAGEMENT_READ_PASSWORD="$(first_non_empty_or_generate generate_hex_32 "$DB_ENV:DB_MANAGEMENT_READ_PASSWORD")"
DB_MANAGEMENT_READ_WRITE_PASSWORD="$(first_non_empty_or_generate generate_hex_32 "$DB_ENV:DB_MANAGEMENT_READ_WRITE_PASSWORD")"
KEYVALDB_PASSWORD="$(first_non_empty_or_generate generate_hex_32 "$KEYVALDB_ENV:KEYVALDB_PASSWORD")"
API_JWT_SECRET="$(first_non_empty_or_generate generate_hex_32 "$API_INFRA_ENV:API_JWT_SECRET" "$API_APP_ENV:API_JWT_SECRET")"
MANAGEMENT_API_JWT_SECRET="$(first_non_empty_or_generate generate_hex_32 "$MANAGEMENT_API_INFRA_ENV:MANAGEMENT_API_JWT_SECRET" "$MANAGEMENT_API_APP_ENV:MANAGEMENT_API_JWT_SECRET")"

upsert_var "$DB_ENV" "DB_APP_ADMIN_PASSWORD" "$DB_APP_ADMIN_PASSWORD"
upsert_var "$DB_ENV" "DB_APP_READ_PASSWORD" "$DB_APP_READ_PASSWORD"
upsert_var "$DB_ENV" "DB_APP_READ_WRITE_PASSWORD" "$DB_APP_READ_WRITE_PASSWORD"
upsert_var "$DB_ENV" "DB_MANAGEMENT_ADMIN_PASSWORD" "$DB_MANAGEMENT_ADMIN_PASSWORD"
upsert_var "$DB_ENV" "DB_MANAGEMENT_READ_PASSWORD" "$DB_MANAGEMENT_READ_PASSWORD"
upsert_var "$DB_ENV" "DB_MANAGEMENT_READ_WRITE_PASSWORD" "$DB_MANAGEMENT_READ_WRITE_PASSWORD"
upsert_var "$KEYVALDB_ENV" "KEYVALDB_PASSWORD" "$KEYVALDB_PASSWORD"

for f in "$API_APP_ENV" "$API_INFRA_ENV"; do
  upsert_var "$f" "API_JWT_SECRET" "$API_JWT_SECRET"
  upsert_var "$f" "DB_APP_READ_PASSWORD" "$DB_APP_READ_PASSWORD"
  upsert_var "$f" "DB_APP_READ_WRITE_PASSWORD" "$DB_APP_READ_WRITE_PASSWORD"
  upsert_var "$f" "KEYVALDB_PASSWORD" "$KEYVALDB_PASSWORD"
done
for f in "$MANAGEMENT_API_APP_ENV" "$MANAGEMENT_API_INFRA_ENV"; do
  upsert_var "$f" "MANAGEMENT_API_JWT_SECRET" "$MANAGEMENT_API_JWT_SECRET"
  upsert_var "$f" "DB_APP_READ_PASSWORD" "$DB_APP_READ_PASSWORD"
  upsert_var "$f" "DB_APP_READ_WRITE_PASSWORD" "$DB_APP_READ_WRITE_PASSWORD"
  upsert_var "$f" "DB_MANAGEMENT_READ_PASSWORD" "$DB_MANAGEMENT_READ_PASSWORD"
  upsert_var "$f" "DB_MANAGEMENT_READ_WRITE_PASSWORD" "$DB_MANAGEMENT_READ_WRITE_PASSWORD"
  upsert_var "$f" "KEYVALDB_PASSWORD" "$KEYVALDB_PASSWORD"
done

# Sync app-facing DB names and usernames from db.env (template-seeded canonical values only; no legacy key aliases).
db_app_name_val="$(get_var "$DB_ENV" DB_APP_NAME)"
db_app_read_user_val="$(get_var "$DB_ENV" DB_APP_READ_USER)"
db_app_rw_user_val="$(get_var "$DB_ENV" DB_APP_READ_WRITE_USER)"
mgmt_db_name_val="$(get_var "$DB_ENV" DB_MANAGEMENT_NAME)"
mgmt_rw_user_val="$(get_var "$DB_ENV" DB_MANAGEMENT_READ_WRITE_USER)"
for _req in "DB_APP_NAME:$db_app_name_val" "DB_APP_READ_USER:$db_app_read_user_val" "DB_APP_READ_WRITE_USER:$db_app_rw_user_val" "DB_MANAGEMENT_NAME:$mgmt_db_name_val" "DB_MANAGEMENT_READ_WRITE_USER:$mgmt_rw_user_val"; do
  _k="${_req%%:*}"
  _v="${_req#*:}"
  if [ -z "$_v" ]; then
    echo "setup.sh: missing ${_k} in ${DB_ENV} (seed from template or fix local env values)." >&2
    exit 1
  fi
done
unset _req _k _v
for f in "$API_APP_ENV" "$API_INFRA_ENV"; do
  upsert_var "$f" "DB_APP_NAME" "$db_app_name_val"
  upsert_var "$f" "DB_APP_READ_USER" "$db_app_read_user_val"
  upsert_var "$f" "DB_APP_READ_WRITE_USER" "$db_app_rw_user_val"
done
for f in "$MANAGEMENT_API_APP_ENV" "$MANAGEMENT_API_INFRA_ENV"; do
  upsert_var "$f" "DB_APP_NAME" "$db_app_name_val"
  upsert_var "$f" "DB_APP_READ_USER" "$db_app_read_user_val"
  upsert_var "$f" "DB_APP_READ_WRITE_USER" "$db_app_rw_user_val"
  upsert_var "$f" "DB_MANAGEMENT_NAME" "$mgmt_db_name_val"
  upsert_var "$f" "DB_MANAGEMENT_READ_WRITE_USER" "$mgmt_rw_user_val"
done

# Host connection defaults only (no secret generation)
bash scripts/env-setup-secrets.sh

# From info.env: workload info anchors WEB_BRAND_NAME / MANAGEMENT_WEB_BRAND_NAME.
apply_override "WEB_BRAND_NAME" "$API_APP_ENV" "$API_INFRA_ENV"
apply_override "LEGAL_NAME" "$API_APP_ENV" "$API_INFRA_ENV"
apply_override "MANAGEMENT_WEB_BRAND_NAME" "$MANAGEMENT_WEB_SIDECAR_INFRA_ENV" "$MANAGEMENT_WEB_SIDECAR_APP_ENV"
_info_np_web="${NEXT_PUBLIC_WEB_BRAND_NAME:-${WEB_BRAND_NAME:-}}"
if [ -n "$_info_np_web" ]; then
  upsert_var "$WEB_APP_ENV" "NEXT_PUBLIC_WEB_BRAND_NAME" "$_info_np_web"
  upsert_var "$WEB_INFRA_ENV" "NEXT_PUBLIC_WEB_BRAND_NAME" "$_info_np_web"
  upsert_var "$WEB_SIDECAR_INFRA_ENV" "NEXT_PUBLIC_WEB_BRAND_NAME" "$_info_np_web"
  upsert_var "$WEB_SIDECAR_APP_ENV" "NEXT_PUBLIC_WEB_BRAND_NAME" "$_info_np_web"
fi
_info_np_legal="${NEXT_PUBLIC_LEGAL_NAME:-${LEGAL_NAME:-}}"
if [ -n "$_info_np_legal" ]; then
  upsert_var "$WEB_APP_ENV" "NEXT_PUBLIC_LEGAL_NAME" "$_info_np_legal"
  upsert_var "$WEB_INFRA_ENV" "NEXT_PUBLIC_LEGAL_NAME" "$_info_np_legal"
  upsert_var "$WEB_SIDECAR_INFRA_ENV" "NEXT_PUBLIC_LEGAL_NAME" "$_info_np_legal"
  upsert_var "$WEB_SIDECAR_APP_ENV" "NEXT_PUBLIC_LEGAL_NAME" "$_info_np_legal"
fi
_info_np_mgmt="${NEXT_PUBLIC_MANAGEMENT_WEB_BRAND_NAME:-${MANAGEMENT_WEB_BRAND_NAME:-}}"
if [ -n "$_info_np_mgmt" ]; then
  upsert_var "$MANAGEMENT_WEB_APP_ENV" "NEXT_PUBLIC_MANAGEMENT_WEB_BRAND_NAME" "$_info_np_mgmt"
  upsert_var "$MANAGEMENT_WEB_INFRA_ENV" "NEXT_PUBLIC_MANAGEMENT_WEB_BRAND_NAME" "$_info_np_mgmt"
  upsert_var "$MANAGEMENT_WEB_SIDECAR_INFRA_ENV" "NEXT_PUBLIC_MANAGEMENT_WEB_BRAND_NAME" "$_info_np_mgmt"
  upsert_var "$MANAGEMENT_WEB_SIDECAR_APP_ENV" "NEXT_PUBLIC_MANAGEMENT_WEB_BRAND_NAME" "$_info_np_mgmt"
fi
# From user-agent.env: outbound HTTP User-Agent per app (template defaults if unset).
apply_override "API_USER_AGENT" "$API_APP_ENV" "$API_INFRA_ENV"
apply_override "MANAGEMENT_API_USER_AGENT" "$MANAGEMENT_API_APP_ENV" "$MANAGEMENT_API_INFRA_ENV"

# From mailer.env: workload mailer values consumed by API (no defaults; devs bring their own; tests use mailpit)
apply_override "MAILER_HOST" "$API_APP_ENV" "$API_INFRA_ENV"
apply_override "MAILER_PORT" "$API_APP_ENV" "$API_INFRA_ENV"
apply_override "MAILER_FROM" "$API_APP_ENV" "$API_INFRA_ENV"
apply_override "MAILER_USERNAME" "$API_APP_ENV" "$API_INFRA_ENV"
apply_override "MAILER_PASSWORD" "$API_APP_ENV" "$API_INFRA_ENV"

# From auth.env: API and management-api (sensible default in example)
apply_override "ACCOUNT_SIGNUP_MODE" "$API_APP_ENV" "$API_INFRA_ENV" "$MANAGEMENT_API_APP_ENV" "$MANAGEMENT_API_INFRA_ENV"
# Web runtime: NEXT_PUBLIC_ACCOUNT_SIGNUP_MODE (same source as ACCOUNT_SIGNUP_MODE; prefer explicit NEXT_PUBLIC_ACCOUNT_SIGNUP_MODE in overrides)
_auth_np_mode="${NEXT_PUBLIC_ACCOUNT_SIGNUP_MODE:-${ACCOUNT_SIGNUP_MODE:-}}"
if [ -n "$_auth_np_mode" ]; then
  upsert_var "$WEB_APP_ENV" "NEXT_PUBLIC_ACCOUNT_SIGNUP_MODE" "$_auth_np_mode"
  upsert_var "$WEB_INFRA_ENV" "NEXT_PUBLIC_ACCOUNT_SIGNUP_MODE" "$_auth_np_mode"
  upsert_var "$WEB_SIDECAR_INFRA_ENV" "NEXT_PUBLIC_ACCOUNT_SIGNUP_MODE" "$_auth_np_mode"
  upsert_var "$WEB_SIDECAR_APP_ENV" "NEXT_PUBLIC_ACCOUNT_SIGNUP_MODE" "$_auth_np_mode"
fi

# From locale.env: canonical DEFAULT_LOCALE / SUPPORTED_LOCALES. API and management-api inherit locale; apply_override writes canonical keys. Web (+ sidecars) get NEXT_PUBLIC_* from explicit overrides or the same canonical values (not legacy key aliases).
apply_override "DEFAULT_LOCALE" "$API_APP_ENV" "$API_INFRA_ENV" "$MANAGEMENT_API_APP_ENV" "$MANAGEMENT_API_INFRA_ENV"
apply_override "SUPPORTED_LOCALES" "$API_APP_ENV" "$API_INFRA_ENV" "$MANAGEMENT_API_APP_ENV" "$MANAGEMENT_API_INFRA_ENV"
_locale_np_default="${NEXT_PUBLIC_DEFAULT_LOCALE:-${DEFAULT_LOCALE:-}}"
_locale_np_supported="${NEXT_PUBLIC_SUPPORTED_LOCALES:-${SUPPORTED_LOCALES:-}}"
if [ -n "$_locale_np_default" ]; then
  upsert_var "$WEB_APP_ENV" "NEXT_PUBLIC_DEFAULT_LOCALE" "$_locale_np_default"
  upsert_var "$WEB_INFRA_ENV" "NEXT_PUBLIC_DEFAULT_LOCALE" "$_locale_np_default"
  upsert_var "$WEB_SIDECAR_INFRA_ENV" "NEXT_PUBLIC_DEFAULT_LOCALE" "$_locale_np_default"
  upsert_var "$WEB_SIDECAR_APP_ENV" "NEXT_PUBLIC_DEFAULT_LOCALE" "$_locale_np_default"
  upsert_var "$MANAGEMENT_WEB_APP_ENV" "NEXT_PUBLIC_DEFAULT_LOCALE" "$_locale_np_default"
  upsert_var "$MANAGEMENT_WEB_INFRA_ENV" "NEXT_PUBLIC_DEFAULT_LOCALE" "$_locale_np_default"
  upsert_var "$MANAGEMENT_WEB_SIDECAR_INFRA_ENV" "NEXT_PUBLIC_DEFAULT_LOCALE" "$_locale_np_default"
  upsert_var "$MANAGEMENT_WEB_SIDECAR_APP_ENV" "NEXT_PUBLIC_DEFAULT_LOCALE" "$_locale_np_default"
fi
if [ -n "$_locale_np_supported" ]; then
  upsert_var "$WEB_APP_ENV" "NEXT_PUBLIC_SUPPORTED_LOCALES" "$_locale_np_supported"
  upsert_var "$WEB_INFRA_ENV" "NEXT_PUBLIC_SUPPORTED_LOCALES" "$_locale_np_supported"
  upsert_var "$WEB_SIDECAR_INFRA_ENV" "NEXT_PUBLIC_SUPPORTED_LOCALES" "$_locale_np_supported"
  upsert_var "$WEB_SIDECAR_APP_ENV" "NEXT_PUBLIC_SUPPORTED_LOCALES" "$_locale_np_supported"
  upsert_var "$MANAGEMENT_WEB_APP_ENV" "NEXT_PUBLIC_SUPPORTED_LOCALES" "$_locale_np_supported"
  upsert_var "$MANAGEMENT_WEB_INFRA_ENV" "NEXT_PUBLIC_SUPPORTED_LOCALES" "$_locale_np_supported"
  upsert_var "$MANAGEMENT_WEB_SIDECAR_INFRA_ENV" "NEXT_PUBLIC_SUPPORTED_LOCALES" "$_locale_np_supported"
  upsert_var "$MANAGEMENT_WEB_SIDECAR_APP_ENV" "NEXT_PUBLIC_SUPPORTED_LOCALES" "$_locale_np_supported"
fi

echo "Applied local env values from generated defaults and overrides."

# Sidecar env: two independent outputs seeded from canonical templates/examples.
# - infra/config/local/*-sidecar.env: Compose env_file values (Docker DNS for APIs).
# - apps/*/sidecar/.env: host npm dev values (matches apps/web/.env.local profile).
echo "Host runtime-config sidecars use apps/*/sidecar/.env; infra *-sidecar.env is Compose-only."
