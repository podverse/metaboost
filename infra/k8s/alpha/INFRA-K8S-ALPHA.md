# Alpha app-of-apps (in-repo)

This directory is the in-repo alpha app-of-apps source.

- Root app: `infra/k8s/alpha-application.yaml`
- Child apps: `infra/k8s/alpha/apps/*.yaml`
- Child app sources: `infra/k8s/alpha/<component>/` (each uses remote `infra/k8s/base/<component>?ref=...` resources)

`ops/kustomization.yaml` references remote `infra/k8s/base/ops?ref=...` (base ops ConfigMaps stay `metaboost-ops-*`).

External GitOps repositories can still consume this model by syncing this repository revision and
tracking the in-repo alpha root and child app manifests.
