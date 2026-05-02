# Remote Kubernetes (GitOps)

Use this guide to deploy Metaboost to a remote Kubernetes cluster with Argo CD and a separate GitOps repository.

This repository provides application code and shared base manifests under `infra/k8s/base/`.

Recommended model:

- Keep per-environment overlays in your GitOps repository.
- Keep environment-specific env files and manifest patches in your GitOps repository.
- Keep encrypted secrets in your GitOps repository.
- Do not run in-repo k8s env contract/render/drift tooling from this repository.

## Scope

- Metaboost repository:
  - Owns app code, Docker build inputs, and shared base manifests.
  - Can be referenced from GitOps overlays via remote Kustomize resources.
- GitOps repository:
  - Owns `apps/metaboost-<env>/` overlays (for example **alpha** under `apps/metaboost-alpha/` in your GitOps repo).
  - Owns Argo CD `Application` and `AppProject` resources.
  - Owns ingress hosts, TLS issuers, ConfigMap/Secret values, and SOPS encrypted secrets.

## Recommended flow

1. Update image tags and remote base refs in your GitOps overlays.
2. Edit env values and Kustomize patches directly in your GitOps overlays.
3. Encrypt/update secrets in your GitOps repository (SOPS). Optional helpers live in this monorepo under [`infra/k8s/scripts/secret-generators/`](../../../infra/k8s/scripts/secret-generators/); see [`INFRA-K8S-SCRIPTS-SECRET-GENERATORS.md`](../../../infra/k8s/scripts/secret-generators/INFRA-K8S-SCRIPTS-SECRET-GENERATORS.md).
4. Run `kubectl kustomize` for each overlay in your GitOps repository.
5. Commit and push GitOps changes.
6. Sync Argo CD applications in dependency order.

## Environment values and manifests

Maintain these directly in your GitOps repository:

- ConfigMap env fragments and `configMapGenerator` input files.
- Secret manifests (encrypted) and any secret projection patches.
- Deployment/Service/Ingress port patches.
- Hostname/CORS/cookie/public URL values.

If your ingress uses cert-manager with Cloudflare DNS01, generate an encrypted SOPS manifest for the
token using the reference script
[`scripts/infra/sops/create_cloudflare_api_token_secret.sh`](../../../scripts/infra/sops/create_cloudflare_api_token_secret.sh).
Copy the helper into your GitOps checkout next to `.sops.yaml` before running; default output is
`secrets/cloudflare-api-token-secret.enc.yaml`. Use a Cloudflare API token with `Zone - DNS - Edit`
and `Zone - Zone - Read`, scoped only to required zones, and ensure cert-manager reads Secret
`cloudflare-api-token-secret` from namespace `cert-manager` with key `api-token`.

## Verification checklist

- Pods are healthy in target namespace.
- Services and ingress are present and routed correctly.
- Public API/web endpoints respond as expected.
- Argo CD shows synced and healthy applications.

## Related

- [ARGOCD-GITOPS-METABOOST.md](ARGOCD-GITOPS-METABOOST.md)
- [GITOPS-CUTOVER-STAGING-CHECKLIST.md](GITOPS-CUTOVER-STAGING-CHECKLIST.md)
- [K8S-ENV-RENDER.md](K8S-ENV-RENDER.md)
- [infra/k8s/INFRA-K8S.md](../../../infra/k8s/INFRA-K8S.md)
