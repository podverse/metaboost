#!/usr/bin/env bash
# Shared definitions for K8s env render: workload helpers and owned output paths.
# Source from render-k8s-env.sh and validate-k8s-env-drift.sh (do not execute directly).

workload_resource_suffix() {
  echo "$1"
}

overlay_dir_for_workload() {
  case "$1" in
    api) echo api ;;
    management-api) echo management-api ;;
    web-sidecar) echo web ;;
    management-web-sidecar) echo management-web ;;
    db) echo db ;;
    valkey) echo keyvaldb ;;
    *) echo "" ;;
  esac
}

# Relative path (under overlay component dir) to rendered dotenv for configMapGenerator envs:.
k8s_config_env_file_relpath_for_workload() {
  local odir suffix
  odir=$(overlay_dir_for_workload "$1")
  if [[ -z "$odir" ]]; then
    echo ""
    return 0
  fi
  suffix=$(workload_resource_suffix "$1")
  echo "${odir}/source/boilerplate-${suffix}-config.env"
}

# Legacy: per-key bundle directory (removed by prune when migrating to source/*.env).
k8s_legacy_config_bundle_relpath_for_workload() {
  local odir suffix
  odir=$(overlay_dir_for_workload "$1")
  if [[ -z "$odir" ]]; then
    echo ""
    return 0
  fi
  suffix=$(workload_resource_suffix "$1")
  echo "${odir}/boilerplate-${suffix}-config.bundle"
}

# Order must match render-k8s-env.sh render_one sequence.
K8S_ENV_RENDER_WORKLOADS=(
  db
  valkey
  api
  web-sidecar
  management-api
  management-web-sidecar
)

# Plan 05 (port sync): workload keys (same names as K8S_ENV_RENDER_WORKLOADS) that receive a generated
# deployment-ports-and-probes.yaml next to the overlay kustomization.
K8S_ENV_RENDER_PORT_PATCH_WORKLOADS=(
  api
  web-sidecar
  management-api
  management-web-sidecar
)

port_patch_filename() {
  echo "deployment-ports-and-probes.yaml"
}

# Relative paths under apps/boilerplate-<env>/ (drift validation + prune).
k8s_env_render_port_patch_relpaths_under_overlay() {
  local odir w
  for w in "${K8S_ENV_RENDER_PORT_PATCH_WORKLOADS[@]}"; do
    odir=$(overlay_dir_for_workload "$w")
    if [[ -z "$odir" ]]; then
      continue
    fi
    echo "${odir}/$(port_patch_filename)"
  done
}

# Ingress backend port numbers (generator-owned; strategic merge on boilerplate-alpha-ingress).
k8s_env_render_port_ingress_relpath_under_overlay() {
  echo "common/ingress-port-backends.yaml"
}

overlay_root_for_env() {
  echo "apps/boilerplate-${1}"
}

# Config dotenv paths relative to apps/boilerplate-<env>/ (used by drift validation).
k8s_env_render_config_env_relpaths_under_overlay() {
  local env_name="$1"
  local rel w
  for w in "${K8S_ENV_RENDER_WORKLOADS[@]}"; do
    rel=$(k8s_config_env_file_relpath_for_workload "$w")
    if [[ -n "$rel" ]]; then
      echo "$rel"
    fi
  done
}

# Legacy bundle dirs to prune (migration from bundle subtrees to source/*.env).
k8s_env_render_legacy_bundle_relpaths_under_overlay() {
  local env_name="$1"
  local rel w
  for w in "${K8S_ENV_RENDER_WORKLOADS[@]}"; do
    rel=$(k8s_legacy_config_bundle_relpath_for_workload "$w")
    if [[ -n "$rel" ]]; then
      echo "$rel"
    fi
  done
}

# deployment-secret-env.yaml paths under apps/boilerplate-<env>/ (drift validation).
k8s_env_render_deployment_secret_patch_relpaths_under_overlay() {
  local odir w
  for w in "${K8S_ENV_RENDER_WORKLOADS[@]}"; do
    odir=$(overlay_dir_for_workload "$w")
    if [[ -z "$odir" ]]; then
      continue
    fi
    echo "${odir}/deployment-secret-env.yaml"
  done
}

# All generator-owned paths relative to GitOps repo root (config dotenv files + legacy bundle dirs + plain Secrets + secret env patches).
k8s_env_render_owned_paths_relative_to_output_repo() {
  local env_name="$1"
  local oroot rel w
  oroot=$(overlay_root_for_env "$env_name")
  for w in "${K8S_ENV_RENDER_WORKLOADS[@]}"; do
    rel=$(k8s_config_env_file_relpath_for_workload "$w")
    [[ -z "$rel" ]] && continue
    echo "${oroot}/${rel}"
    legacy=$(k8s_legacy_config_bundle_relpath_for_workload "$w")
    [[ -z "$legacy" ]] && continue
    echo "${oroot}/${legacy}"
    odir=$(overlay_dir_for_workload "$w")
    [[ -z "$odir" ]] && continue
    echo "${oroot}/${odir}/deployment-secret-env.yaml"
    suffix=$(workload_resource_suffix "$w")
    echo "secrets/boilerplate-${env_name}/plain/boilerplate-${suffix}-secrets.yaml"
  done
  for w in "${K8S_ENV_RENDER_PORT_PATCH_WORKLOADS[@]}"; do
    odir=$(overlay_dir_for_workload "$w")
    if [[ -z "$odir" ]]; then
      continue
    fi
    echo "${oroot}/${odir}/$(port_patch_filename)"
  done
  echo "${oroot}/$(k8s_env_render_port_ingress_relpath_under_overlay)"
}
