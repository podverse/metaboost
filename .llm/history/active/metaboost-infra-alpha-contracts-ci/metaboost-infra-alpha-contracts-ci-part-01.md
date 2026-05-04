# metaboost-infra-alpha-contracts-ci

Started: 2026-05-03

### Session 1 - 2026-05-03

#### Prompt (Developer)

execute the plan

#### Key Decisions

- Added `.github/workflows/metaboost-infra-alpha-contracts.yml`: pinned kustomize 5.5.0, `kustomize build` over `infra/k8s/alpha/*` with `kustomization.yaml` guard; PR path filter `infra/k8s/**` plus `workflow_dispatch`.
- Documented monorepo CI vs GitOps contracts in `infra/k8s/scripts/secret-generators/INFRA-K8S-SCRIPTS-SECRET-GENERATORS.md`.
- Skipped monorepo version-contract script: example `infra/k8s/alpha` overlays do not carry `ghcr.io/podverse/metaboost` image patches (GitOps-only contract applies on `metaboost.cc`).

#### Files Modified

- `.github/workflows/metaboost-infra-alpha-contracts.yml`
- `infra/k8s/scripts/secret-generators/INFRA-K8S-SCRIPTS-SECRET-GENERATORS.md`
