#!/usr/bin/env bash
# Render Kustomize config dotenv files (source/metaboost-*-config.env for configMapGenerator envs:), plain Secret YAML, and secret env patches.
# Usage: render-k8s-env.sh --env alpha|beta|prod [--output-repo PATH] [--dry-run] [--no-prune]
# Fills empty classification local_generator: hex_32 secrets via merge-env (state file + optional plain/*.yaml reuse); see docs/development/k8s/K8S-ENV-RENDER.md.
#
# When not using --dry-run, OUTPUT_REPO is required: pass --output-repo PATH or set METABOOST_K8S_OUTPUT_REPO
# to the GitOps repo root (no implicit sibling or out/ default).
#
# Optional GitOps classification overlay (merged after monorepo infra/env/overrides/remote-k8s.yaml):
#   METABOOST_REMOTE_K8S_CLASSIFICATION_OVERLAY — absolute path to YAML (overrides default path), or
#   default: ${METABOOST_K8S_OUTPUT_REPO}/apps/metaboost-<env>/env/remote-k8s.yaml when that file exists,
#   else ${OUTPUT_REPO}/... when METABOOST_K8S_OUTPUT_REPO is unset (e.g. dry-run with only output repo).
# When writing to a temp dir, set METABOOST_K8S_OUTPUT_REPO to the real GitOps root so the overlay is read
# from committed files (validate-k8s-env-drift.sh does this).
# Prune: by default, removes generator-owned config dotenv files and legacy bundle dirs, plain Secrets, deployment-secret-env.yaml
# patches, and (when plan 05 port list is populated) deployment-ports-and-probes.yaml per manifest.
# Use --no-prune to skip deletion. --dry-run never prunes or writes.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

# shellcheck source=k8s-env-render-manifest.inc.sh
source "$SCRIPT_DIR/k8s-env-render-manifest.inc.sh"

ENV_NAME=""
OUTPUT_REPO=""
DRY_RUN=0
PRUNE=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env)
      ENV_NAME="${2:-}"
      shift 2
      ;;
    --output-repo)
      OUTPUT_REPO="${2:-}"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --no-prune)
      PRUNE=0
      shift
      ;;
    -h | --help)
      sed -n '1,15p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$ENV_NAME" ]]; then
  echo "Error: --env is required (alpha|beta|prod)" >&2
  exit 1
fi

if ! command -v ruby >/dev/null 2>&1; then
  echo "Error: ruby is required (uses stdlib YAML)." >&2
  exit 1
fi

if [[ -z "${OUTPUT_REPO:-}" && -n "${METABOOST_K8S_OUTPUT_REPO:-}" ]]; then
  OUTPUT_REPO="$METABOOST_K8S_OUTPUT_REPO"
fi

if [[ "$DRY_RUN" -eq 0 && -z "${OUTPUT_REPO:-}" ]]; then
  echo "Error: set METABOOST_K8S_OUTPUT_REPO or pass --output-repo (absolute path to GitOps repo root)." >&2
  exit 1
fi

NAMESPACE="metaboost-${ENV_NAME}"
OVERLAY="apps/metaboost-${ENV_NAME}"
if [[ -n "${OUTPUT_REPO:-}" ]]; then
  SECRETS_DIR="${OUTPUT_REPO}/secrets/metaboost-${ENV_NAME}"
  PLAIN_SECRETS_DIR="${SECRETS_DIR}/plain"
else
  SECRETS_DIR=""
  PLAIN_SECRETS_DIR=""
fi

CLASSIFICATION_OVERLAY_FILE=""
if [[ -n "${METABOOST_REMOTE_K8S_CLASSIFICATION_OVERLAY:-}" ]]; then
  CLASSIFICATION_OVERLAY_FILE="${METABOOST_REMOTE_K8S_CLASSIFICATION_OVERLAY}"
elif [[ -n "${METABOOST_K8S_OUTPUT_REPO:-}" ]]; then
  CLASSIFICATION_OVERLAY_FILE="$(cd "${METABOOST_K8S_OUTPUT_REPO}" && pwd)/apps/metaboost-${ENV_NAME}/env/remote-k8s.yaml"
elif [[ -n "${OUTPUT_REPO:-}" ]]; then
  CLASSIFICATION_OVERLAY_FILE="$(cd "${OUTPUT_REPO}" && pwd)/apps/metaboost-${ENV_NAME}/env/remote-k8s.yaml"
fi

CLASSIFICATION_OVERLAY_ARGS=()
if [[ -n "$CLASSIFICATION_OVERLAY_FILE" && -f "$CLASSIFICATION_OVERLAY_FILE" ]]; then
  CLASSIFICATION_OVERLAY_ARGS=(--classification-overlay "$CLASSIFICATION_OVERLAY_FILE")
  echo "Using GitOps classification overlay: ${CLASSIFICATION_OVERLAY_FILE}"
fi

# Per-run state: reuse hex_32 secrets across merge-env calls (e.g. VALKEY_PASSWORD for api after valkey).
HEX32_STATE="$(mktemp)"
trap 'rm -f "$HEX32_STATE"' EXIT
MERGE_HEX32_FILL_ARGS=(--fill-empty-local-generator-secrets --hex32-state-file "$HEX32_STATE")
if [[ -n "${PLAIN_SECRETS_DIR:-}" && -d "$PLAIN_SECRETS_DIR" ]]; then
  MERGE_HEX32_FILL_ARGS+=(--reuse-plain-secrets-dir "$PLAIN_SECRETS_DIR")
fi

render_one() {
  local group=$1
  local merged
  merged=$(mktemp)
  shopt -s nullglob
  local overrides=(dev/env-overrides/"${ENV_NAME}"/*.env)
  shopt -u nullglob

  local extra_args=()
  local f
  for f in "${overrides[@]}"; do
    extra_args+=(--extra-env "$f")
  done

  ruby "$REPO_ROOT/scripts/env-classification/metaboost-env.rb" merge-env \
    --profile remote_k8s \
    --group "$group" \
    "${CLASSIFICATION_OVERLAY_ARGS[@]}" \
    "${MERGE_HEX32_FILL_ARGS[@]}" \
    "${extra_args[@]}" >"$merged"

  export METABOOST_ENV_PROFILE=remote_k8s

  local suffix odir
  suffix=$(workload_resource_suffix "$group")
  odir=$(overlay_dir_for_workload "$group")
  if [[ -z "$odir" ]]; then
    rm -f "$merged"
    return 0
  fi

  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "=== Config env ${group}"
    env_preview="$(mktemp)"
    ruby "$SCRIPT_DIR/render_k8s_env.rb" \
      --group "$group" \
      --merged-env "$merged" \
      "${CLASSIFICATION_OVERLAY_ARGS[@]}" \
      --namespace "$NAMESPACE" \
      --environment "$ENV_NAME" \
      --resource-suffix "$suffix" \
      --emit config-env \
      --config-env-file "$env_preview" || true
    if [[ -f "$env_preview" ]]; then
      sed "s/^/  /" "$env_preview" || true
      rm -f "$env_preview"
    fi
    echo "=== Secret ${group}"
    ruby "$SCRIPT_DIR/render_k8s_env.rb" \
      --group "$group" \
      --merged-env "$merged" \
      "${CLASSIFICATION_OVERLAY_ARGS[@]}" \
      --namespace "$NAMESPACE" \
      --environment "$ENV_NAME" \
      --resource-suffix "$suffix" \
      --emit secret || true
    echo "=== Secret env patch ${group}"
    ruby "$SCRIPT_DIR/render_k8s_env.rb" \
      --group "$group" \
      --merged-env "$merged" \
      "${CLASSIFICATION_OVERLAY_ARGS[@]}" \
      --namespace "$NAMESPACE" \
      --environment "$ENV_NAME" \
      --resource-suffix "$suffix" \
      --emit secret-env-patch || true
    rm -f "$merged"
    return 0
  fi

  local dest_base config_env_f
  dest_base="${OUTPUT_REPO}/${OVERLAY}/${odir}"
  config_env_f="${OUTPUT_REPO}/${OVERLAY}/$(k8s_config_env_file_relpath_for_workload "$group")"
  mkdir -p "$dest_base"
  mkdir -p "$(dirname "$config_env_f")"
  mkdir -p "$PLAIN_SECRETS_DIR"

  set +e
  ruby "$SCRIPT_DIR/render_k8s_env.rb" \
    --group "$group" \
    --merged-env "$merged" \
    "${CLASSIFICATION_OVERLAY_ARGS[@]}" \
    --namespace "$NAMESPACE" \
    --environment "$ENV_NAME" \
    --resource-suffix "$suffix" \
    --emit config-env \
    --config-env-file "$config_env_f"
  env_rc=$?
  set -e
  case $env_rc in
    0) echo "Wrote config env ${config_env_f}" ;;
    3) echo "Skip env group ${group} (no_env_from)" ;;
    4) echo "Skip config env for ${group} (no config keys)" ;;
    *) echo "Error: config-env render failed for ${group} (exit $env_rc)" >&2; rm -f "$merged"; exit 1 ;;
  esac
  if [[ $env_rc -ne 0 ]]; then
    rm -f "${config_env_f}"
  fi

  set +e
  ruby "$SCRIPT_DIR/render_k8s_env.rb" \
    --group "$group" \
    --merged-env "$merged" \
    "${CLASSIFICATION_OVERLAY_ARGS[@]}" \
    --namespace "$NAMESPACE" \
    --environment "$ENV_NAME" \
    --resource-suffix "$suffix" \
    --emit secret >"${PLAIN_SECRETS_DIR}/metaboost-${suffix}-secrets.yaml"
  sec_rc=$?
  set -e
  case $sec_rc in
    0) echo "Wrote ${PLAIN_SECRETS_DIR}/metaboost-${suffix}-secrets.yaml (encrypt with sops before commit)" ;;
    3) : ;;
    4) echo "Skip Secret for ${group} (no secret keys)" ;;
    *) echo "Error: secret render failed for ${group} (exit $sec_rc)" >&2; rm -f "$merged"; exit 1 ;;
  esac
  if [[ $sec_rc -ne 0 ]]; then
    rm -f "${PLAIN_SECRETS_DIR}/metaboost-${suffix}-secrets.yaml"
  fi

  set +e
  ruby "$SCRIPT_DIR/render_k8s_env.rb" \
    --group "$group" \
    --merged-env "$merged" \
    "${CLASSIFICATION_OVERLAY_ARGS[@]}" \
    --namespace "$NAMESPACE" \
    --environment "$ENV_NAME" \
    --resource-suffix "$suffix" \
    --emit secret-env-patch >"${dest_base}/deployment-secret-env.yaml"
  patch_rc=$?
  set -e
  case $patch_rc in
    0) echo "Wrote ${dest_base}/deployment-secret-env.yaml" ;;
    3) : ;;
    4) echo "Skip secret-env patch for ${group} (no secret keys)" ;;
    *)
      echo "Error: secret-env-patch render failed for ${group} (exit $patch_rc)" >&2
      rm -f "$merged"
      exit 1
      ;;
  esac
  if [[ $patch_rc -ne 0 ]]; then
    rm -f "${dest_base}/deployment-secret-env.yaml"
  fi

  rm -f "$merged"
}

echo "ENV=${ENV_NAME} OUTPUT_REPO=${OUTPUT_REPO} NAMESPACE=${NAMESPACE}"

if [[ "$DRY_RUN" -eq 0 && "$PRUNE" -eq 1 ]]; then
  echo "Pruning generator-owned paths under ${OUTPUT_REPO}"
  while IFS= read -r rel; do
    rm -rf "${OUTPUT_REPO}/${rel}"
  done < <(k8s_env_render_owned_paths_relative_to_output_repo "$ENV_NAME")
fi

render_one db
render_one valkey
render_one api
render_one web-sidecar
render_one management-api
render_one management-web-sidecar

if [[ "$DRY_RUN" -eq 0 ]]; then
  export METABOOST_ENV_PROFILE="${METABOOST_ENV_PROFILE:-remote_k8s}"
  ruby "$SCRIPT_DIR/render_remote_k8s_ports.rb" --env "$ENV_NAME" --output-repo "$OUTPUT_REPO"
fi

echo "Render complete."
