#!/usr/bin/env bash
# Ensure ~/.config/metaboost/... exists for optional env overrides.
# Defaults and key lists live in infra/env/classification/base.yaml; no repo example files are required.
# Invoked by prepare-local-env-overrides.sh (--profile local) or prepare-k8s-env-overrides.sh (--profile k8s --env <name>).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

PROFILE=""
ENV_NAME=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --profile)
      PROFILE="${2:-}"
      shift 2
      ;;
    --env)
      ENV_NAME="${2:-}"
      shift 2
      ;;
    -h | --help)
      echo "Usage: prepare-home-env-overrides.sh --profile local"
      echo "       prepare-home-env-overrides.sh --profile k8s --env alpha|beta|prod"
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

if [[ "$PROFILE" != "local" ]] && [[ "$PROFILE" != "k8s" ]]; then
  echo "Error: --profile local|k8s is required" >&2
  exit 1
fi

if [[ "$PROFILE" == "k8s" ]] && [[ -z "$ENV_NAME" ]]; then
  echo "Error: --env is required for --profile k8s" >&2
  exit 1
fi

if [[ "$PROFILE" == "local" ]]; then
  if [[ -n "${METABOOST_HOME_OVERRIDES_DIR:-}" ]]; then
    HOME_OVERRIDES_RAW="$METABOOST_HOME_OVERRIDES_DIR"
  else
    HOME_OVERRIDES_RAW="${HOME:-}/.config/metaboost/local-env-overrides"
  fi
else
  if [[ -n "${METABOOST_HOME_ENV_OVERRIDES_DIR:-}" ]]; then
    HOME_OVERRIDES_RAW="$METABOOST_HOME_ENV_OVERRIDES_DIR"
  else
    HOME_OVERRIDES_RAW="${HOME:-}/.config/metaboost/${ENV_NAME}-env-overrides"
  fi
fi

HOME_OVERRIDES_EXPANDED="${HOME_OVERRIDES_RAW/#\~/$HOME}"
mkdir -p "$HOME_OVERRIDES_EXPANDED"
HOME_OVERRIDES_DIR="$(cd "$HOME_OVERRIDES_EXPANDED" && pwd)"

if ! command -v ruby >/dev/null 2>&1; then
  echo "Error: ruby is required to generate home override stubs from classification." >&2
  exit 1
fi

METABOOST_ENV_RUBY="${METABOOST_ENV_RUBY:-ruby}"
MERGE_PROFILE="local_docker"
if [[ "$PROFILE" == "k8s" ]]; then
  MERGE_PROFILE="remote_k8s"
fi

"$METABOOST_ENV_RUBY" "$REPO_ROOT/scripts/env-overrides/write-home-override-stubs.rb" \
  --profile "$MERGE_PROFILE" \
  --output-dir "$HOME_OVERRIDES_DIR"

echo "Override directory ready: $HOME_OVERRIDES_DIR"
echo "New files get every anchor override key with merged classification defaults (base.yaml + profile overlay)."
echo "Existing files are not overwritten wholesale; missing anchor keys are appended with defaults. Use write-home-override-stubs.rb --force to replace a file entirely (see script help)."

if [[ "$PROFILE" == "local" ]]; then
  cat <<EOF

Then run:

  make local_env_link
  make local_env_setup

Link creates symlinks in dev/env-overrides/local/ for files that exist here; setup merges overrides into generated env.
EOF
else
  cat <<EOF

Then run:

  make k8s_env_link K8S_ENV=${ENV_NAME}

Link creates symlinks in dev/env-overrides/${ENV_NAME}/ for files that exist here so render-k8s-env can merge them.
EOF
fi
