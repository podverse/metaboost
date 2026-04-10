#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$REPO_ROOT"

CLUSTER_NAME="${K3D_CLUSTER_NAME:-boilerplate-local}"

bash scripts/local-env/setup.sh
bash scripts/infra/k3d/build-images.sh

if ! k3d cluster list "$CLUSTER_NAME" >/dev/null 2>&1; then
  k3d cluster create "$CLUSTER_NAME" \
    --agents 1 \
    --servers 1 \
    --port "4000:4000@loadbalancer" \
    --port "4002:4002@loadbalancer" \
    --port "4100:4100@loadbalancer" \
    --port "4102:4102@loadbalancer" \
    --port "5532:5432@loadbalancer" \
    --port "6479:6379@loadbalancer"
fi

kubectl config use-context "k3d-$CLUSTER_NAME" >/dev/null

LOCAL_IMAGES=(
  boilerplate-local-api:latest
  boilerplate-local-management-api:latest
  boilerplate-local-web-sidecar:latest
  boilerplate-local-web:latest
  boilerplate-local-management-web-sidecar:latest
  boilerplate-local-management-web:latest
)

is_image_present_on_all_nodes() {
  local image="$1"
  local image_repo="docker.io/library/${image%%:*}"

  for node in "k3d-${CLUSTER_NAME}-server-0" "k3d-${CLUSTER_NAME}-agent-0"; do
    if ! docker exec "$node" crictl images | grep -Fq "$image_repo"; then
      return 1
    fi
  done
  return 0
}

import_and_verify_image() {
  local image="$1"
  local attempt
  for attempt in 1 2 3; do
    k3d image import -c "$CLUSTER_NAME" "$image"
    if is_image_present_on_all_nodes "$image"; then
      echo "Verified image on all k3d nodes: $image"
      return 0
    fi
    echo "WARN: Image '$image' missing on one or more nodes after import attempt ${attempt}/3."
    sleep 2
  done
  echo "ERROR: Failed to verify image '$image' on all k3d nodes after 3 attempts."
  echo "       Run 'make local_k3d_down' then 'make local_k3d_up' to retry."
  return 1
}

# Import and verify each image individually to avoid partial image availability.
for image in "${LOCAL_IMAGES[@]}"; do
  import_and_verify_image "$image"
done

# Re-check the full set once all imports are complete. On constrained nodes, kubelet image
# garbage collection can evict a previously imported image while later images are imported.
for image in "${LOCAL_IMAGES[@]}"; do
  if ! is_image_present_on_all_nodes "$image"; then
    echo "ERROR: Image '$image' is missing after full import pass."
    echo "       This commonly indicates k3d node image garbage collection (disk pressure)."
    echo "       Free Docker disk space / increase Docker Desktop disk size, then retry:"
    echo "       make local_k3d_down && make local_k3d_up"
    exit 1
  fi
done

bash scripts/infra/k3d/create-local-secrets.sh
bash scripts/infra/argocd/install.sh
bash scripts/infra/argocd/local-dev-user.sh
bash scripts/infra/argocd/bootstrap.sh

# Workloads from the working tree (stack Application has manual sync; see
# infra/k8s/argocd/boilerplate-local-stack-application.yaml).
kubectl apply -k infra/k8s/local/stack

echo ""
echo "Local k3d + ArgoCD stack is up."
echo "API:             http://localhost:4000"
echo "Web:             http://localhost:4002"
echo "Management API:  http://localhost:4100"
echo "Management Web:  http://localhost:4102"
echo "Postgres:        localhost:5532"
echo "Valkey:          localhost:6479"
echo ""
echo "ArgoCD UI:"
echo "  kubectl -n argocd port-forward svc/argocd-server 8080:443"
echo "  open https://localhost:8080"
