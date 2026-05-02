# Remote Kubernetes (GitOps)

Use this guide to deploy Metaboost to a remote Kubernetes cluster with Argo CD and a **separate
GitOps repository**.

**Working directory:** This runbook assumes you have a local checkout of your GitOps repository that
contains `apps/`, `argocd/`, `secrets/`, and `scripts/`. Cluster-facing and secret-generation steps
run from that GitOps repository, not from this Metaboost source repository.

This repository is the source for reusable base manifests under `infra/k8s/base/` and reference
secret-generator scripts under
[`infra/k8s/scripts/secret-generators/`](../../../infra/k8s/scripts/secret-generators/INFRA-K8S-SCRIPTS-SECRET-GENERATORS.md).

## Scope and model

- Metaboost repository:
  - Owns application code, Docker build inputs, and shared Kustomize bases (`infra/k8s/base/*`).
  - Owns reference docs and generator source scripts.
- GitOps repository:
  - Owns environment overlays (`apps/metaboost-<env>/`).
  - Owns Argo CD `AppProject` and `Application` CRs.
  - Owns ingress hosts, TLS issuer wiring, ConfigMap/Secret values, and encrypted SOPS manifests.

The recommended operating model is:

- Keep all environment-specific values and secrets in your GitOps repository.
- Pin remote bases by immutable tag/sha.
- Sync applications in dependency order.

## Defaults

- **Image tags (alpha example):** set app images to `newTag: "X.Y.Z-staging.N"`.
- **Remote base refs (alpha example):** set Metaboost remote bases to `?ref=X.Y.Z-staging.N`.
- **Bump together:** every publish bump should update both `?ref=` and `images[].newTag`.
- **No branch refs:** do not commit moving refs like `?ref=main` or `?ref=develop`.

## Encrypted secrets (GitOps repository)

Workload and registry pull secrets should live **only** in your GitOps repository (commonly under
`secrets/`).

Required secret names expected by current Metaboost base manifests:

- `metaboost-db-secrets`
- `metaboost-api-secrets`
- `metaboost-management-api-secrets`
- `metaboost-keyvaldb-secrets`
- `github-registry-secret`
- optional: `metaboost-mailer-opaque`

Reference generator scripts live in this repository under
[`infra/k8s/scripts/secret-generators/`](../../../infra/k8s/scripts/secret-generators/INFRA-K8S-SCRIPTS-SECRET-GENERATORS.md).
Many operators keep synced copies under `metaboost.cc/scripts/secret-generators/` (or equivalent)
and run them there so outputs land directly in that repo’s `./secrets/` tree.

If your ingress uses cert-manager DNS01 with Cloudflare, use
[`scripts/infra/sops/create_cloudflare_api_token_secret.sh`](../../../scripts/infra/sops/create_cloudflare_api_token_secret.sh)
to generate `secrets/cloudflare-api-token-secret.enc.yaml` in your GitOps repository.

## End-to-end command checklist

Set once for your target environment:

```fish
set -gx GITOPS_REPO_DIR "<absolute-path-to-your-gitops-repository>"
set -gx KUBE_CONTEXT "<kubectl-context-name>"
set -gx EXPECTED_SERVER_FRAGMENT "<unique-substring-of-api-server-url>"
set -gx NAMESPACE "metaboost-alpha"
set -gx ENV "alpha"
```

Prerequisites: `kubectl`, `sops`, and access to the GitOps repo’s `.sops.yaml` keys.

### 1. Hard safety gate (context + API server)

```fish
set current (kubectl config current-context)
test "$current" = "$KUBE_CONTEXT"; or begin
  echo "wrong kubectl context"
  exit 1
end
set server (kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}')
string match -q "*$EXPECTED_SERVER_FRAGMENT*" "$server"; or begin
  echo "API server mismatch: $server"
  exit 1
end
echo "gate ok: $server"
```

### 2. Ensure namespace exists

```fish
cd "$GITOPS_REPO_DIR"
kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
```

### 3. Generate encrypted secrets (GitOps repo)

Use your GitOps repository’s script copies (for example under `./scripts/secret-generators/`):

```fish
cd "$GITOPS_REPO_DIR"
bash ./scripts/secret-generators/create_github_registry_secret.sh "$ENV"
bash ./scripts/secret-generators/create_all_secrets_auto_gen.sh "$ENV"
bash ./scripts/secret-generators/check_db_secret_contract.sh "$ENV"
```

If your GitOps repo includes a Metaboost version-contract script (for example
`scripts/check_metaboost_alpha_version_contract.sh` in `metaboost.cc`), run it before sync.

### 4. Server dry-run secret apply, then apply for real

```fish
cd "$GITOPS_REPO_DIR"
test -f .sops.yaml; or begin
  echo "need .sops.yaml at gitops root"
  exit 1
end

for f in ./secrets/metaboost-"$ENV"-*.enc.yaml
  test -e "$f"; or continue
  sops -d "$f" | kubectl apply --dry-run=server -f -
end

if test -f ./secrets/github-registry-secret.enc.yaml
  sops -d ./secrets/github-registry-secret.enc.yaml | kubectl apply --dry-run=server -f -
end

for f in ./secrets/metaboost-"$ENV"-*.enc.yaml
  test -e "$f"; or continue
  sops -d "$f" | kubectl apply -f -
end

if test -f ./secrets/github-registry-secret.enc.yaml
  sops -d ./secrets/github-registry-secret.enc.yaml | kubectl apply -f -
end
```

### 5. Update GitOps overlay env and patches

Maintain these in your GitOps repository:

- `apps/metaboost-<env>/<component>/source/*.env`
- deployment/service/ingress patches
- hostname/CORS/cookie/public URL values
- TLS issuer annotations and cert-manager integration details

### 6. Local kustomize compile for every overlay

```fish
cd "$GITOPS_REPO_DIR"
for c in common db keyvaldb ops api management-api web management-web
  kubectl kustomize "apps/metaboost-$ENV/$c" --load-restrictor LoadRestrictionsNone >/dev/null
  echo "ok apps/metaboost-$ENV/$c"
end
```

### 7. Apply Argo `AppProject` and `Application` manifests

```fish
cd "$GITOPS_REPO_DIR"
kubectl apply --dry-run=server -f argocd/apps/project-metaboost.yaml
kubectl apply --dry-run=server -f "argocd/metaboost-$ENV/"
kubectl apply -f argocd/apps/project-metaboost.yaml
kubectl apply -f "argocd/metaboost-$ENV/"
```

### 8. Sync applications in dependency order and verify

Recommended sync order:

1. `metaboost-<env>-common`
2. `metaboost-<env>-db`
3. `metaboost-<env>-keyvaldb`
4. `metaboost-<env>-ops`
5. `metaboost-<env>-api`
6. `metaboost-<env>-management-api`
7. `metaboost-<env>-web`
8. `metaboost-<env>-management-web`

Then verify:

```fish
kubectl -n "$NAMESPACE" get pods
kubectl -n "$NAMESPACE" get svc,ingress
kubectl -n argocd get applications
```

## GitOps overlay contract

- Every deployed overlay uses immutable refs for remote Metaboost bases.
- Every Metaboost workload image tag in overlays matches the pinned release ref.
- ConfigMap env fragments stay in overlay `source/*.env` files; secrets stay in encrypted manifests.
- Keep app-specific hostnames and URL/cookie/CORS values in GitOps overlay files, not in this repo.

## Argo CD source contract

- `AppProject` must allow both your GitOps repo and `https://github.com/podverse/metaboost.git` in
  `sourceRepos` so remote Kustomize URLs resolve.
- `Application.spec.source.path` should reference overlay paths under
  `apps/metaboost-<env>/<component>`.
- Use one tracked branch in GitOps (commonly `main`) and separate environment paths
  (`metaboost-alpha`, `metaboost-beta`, `metaboost-prod`) instead of branch-per-env.

## Verification checklist

- Argo applications are **Synced** and **Healthy**.
- Namespace pods are running and stable (no restart loops).
- DB and Valkey are reachable by API and management-api workloads.
- Public web/API and management hostnames route correctly via ingress.
- API health checks return expected status at your deployed paths.

## Related docs

- [ARGOCD-GITOPS-METABOOST.md](ARGOCD-GITOPS-METABOOST.md)
- [GITOPS-CUTOVER-STAGING-CHECKLIST.md](GITOPS-CUTOVER-STAGING-CHECKLIST.md)
- [K8S-ENV-RENDER.md](K8S-ENV-RENDER.md)
- [infra/k8s/INFRA-K8S.md](../../../infra/k8s/INFRA-K8S.md)

Environment-specific alpha details (example GitOps layout, hostnames, and scripts) are documented in
`metaboost.cc/docs/k8s/metaboost-alpha/README.md`.

## Documentation guardrails (must pass)

When updating this runbook:

- Keep the command checklist executable from a GitOps repository root.
- Keep required secret names aligned with current `infra/k8s/base/*` manifests.
- Keep the sync order aligned with actual component dependencies.
- Keep links synchronized with:
  - `docs/development/k8s/ARGOCD-GITOPS-METABOOST.md`
  - `docs/development/k8s/GITOPS-CUTOVER-STAGING-CHECKLIST.md`
  - environment-specific GitOps docs (for example `metaboost.cc/docs/k8s/metaboost-alpha/README.md`)
