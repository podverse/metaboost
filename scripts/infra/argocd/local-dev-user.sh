#!/usr/bin/env bash
#
# Configures a known local ArgoCD user for local development only.
# Creates user "localdev" with password "Test!1Aa" and sets the built-in
# admin password to the same so both logins work without looking up secrets.
# Only run this in local k3d clusters; do not use in production.
#
set -euo pipefail

ARGOCD_NS="${ARGOCD_NS:-argocd}"
LOCALDEV_USER="${ARGOCD_LOCALDEV_USER:-localdev}"
LOCALDEV_PASSWORD="${ARGOCD_LOCALDEV_PASSWORD:-Test!1Aa}"

# Ensure server is available so we can use its image for bcrypt
kubectl -n "$ARGOCD_NS" get deployment argocd-server -o name >/dev/null

# Set initial admin password (plaintext in secret; ArgoCD reads it on first use)
kubectl patch secret argocd-initial-admin-secret -n "$ARGOCD_NS" \
  --type merge \
  -p "{\"stringData\":{\"password\":\"$LOCALDEV_PASSWORD\"}}" 2>/dev/null || true

# Use the same image as the server to generate bcrypt (no extra pull)
IMAGE=$(kubectl get deployment -n "$ARGOCD_NS" argocd-server -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null || echo "quay.io/argoproj/argocd:stable")
BCRYPT=$(kubectl run -n "$ARGOCD_NS" argocd-bcrypt --rm -i --restart=Never --image="$IMAGE" -- \
  argocd account bcrypt --password "$LOCALDEV_PASSWORD" 2>/dev/null | tr -d '\n\r')

if [[ -z "${BCRYPT:-}" ]] || [[ "$BCRYPT" != \$2* ]]; then
  echo "WARN: Could not generate bcrypt hash for localdev user; skipping local user setup."
  echo "      You can log in with username 'admin' and password '$LOCALDEV_PASSWORD' (see above)."
  exit 0
fi

# Add localdev to argocd-cm (login + apiKey)
kubectl patch configmap argocd-cm -n "$ARGOCD_NS" --type merge \
  -p "{\"data\":{\"accounts.$LOCALDEV_USER\":\"apiKey, login\"}}" 2>/dev/null || true

# Add localdev password to argocd-secret (value must be bcrypt, stored base64 in Secret)
B64=$(echo -n "$BCRYPT" | base64 | tr -d '\n')
kubectl patch secret argocd-secret -n "$ARGOCD_NS" --type merge \
  -p "{\"data\":{\"accounts.$LOCALDEV_USER.password\":\"$B64\"}}"

# Default policy: full access for local dev (so localdev gets admin)
kubectl patch configmap argocd-rbac-cm -n "$ARGOCD_NS" --type merge \
  -p '{"data":{"policy.default":"role:admin"}}' 2>/dev/null || true

# Restart server so it picks up new user and secret
kubectl -n "$ARGOCD_NS" rollout restart deployment argocd-server
kubectl -n "$ARGOCD_NS" rollout status deployment argocd-server --timeout=120s

echo "ArgoCD local dev user configured: username '$LOCALDEV_USER', password '$LOCALDEV_PASSWORD'."
echo "Built-in admin password set to the same; use either account to log in."
