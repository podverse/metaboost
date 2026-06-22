# Alpha app-of-apps (in-repo)

This directory is the in-repo alpha app-of-apps source.

- Root app: `infra/k8s/alpha-application.yaml`
- Child apps: `infra/k8s/alpha/apps/*.yaml`
- Child app sources: `infra/k8s/alpha/<component>/` (each uses remote `infra/k8s/base/<component>?ref=...` resources)

`ops/kustomization.yaml` references remote `infra/k8s/base/ops?ref=...` (base ops ConfigMaps stay `metaboost-ops-*`).

Committed overlay `kustomization.yaml` files use publish placeholder **`X.Y.Z-staging.N`** on remote `?ref=` URLs (and matching image tags where applicable). Replace that value with the immutable staging tag after **Publish (staging)**. PR CI (`.github/workflows/metaboost-infra-alpha-contracts.yml`) and [`scripts/k8s/kustomize-build-metaboost-alpha-overlays.sh`](../../scripts/k8s/kustomize-build-metaboost-alpha-overlays.sh) substitute the commit SHA when rendering so overlays validate before a publish tag exists.

External GitOps repositories can still consume this model by syncing this repository revision and
tracking the in-repo alpha root and child app manifests.
