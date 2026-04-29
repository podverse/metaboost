# Alpha child applications

This directory contains Argo CD child **`Application`** manifests for the in-repo alpha app-of-apps
model.

- Root app: `infra/k8s/alpha-application.yaml`
- Child app source path: `infra/k8s/alpha/apps`

Each child app points to an in-repo alpha component path (for example
`infra/k8s/alpha/api`, `infra/k8s/alpha/web`, `infra/k8s/alpha/ops`) and targets the
`metaboost-alpha` namespace.

External GitOps repositories can still consume this model by tracking this repository and syncing
`infra/k8s/alpha-application.yaml` and `infra/k8s/alpha/apps/` from the chosen revision.
