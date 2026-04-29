# K8s Alpha App-of-Apps Reference Alignment Checklist (06b)

Date: 2026-04-28
Phase: 06b-k8s-alpha-app-of-apps-parity

## Scope

- Root alpha Argo CD application and child app layout.
- Child app naming, source paths, and Argo wiring.
- Removal of scaffold-only alpha wording in k8s docs.

## Checklist

- [x] Root alpha app exists at `infra/k8s/alpha-application.yaml` and points to `infra/k8s/alpha/apps`.
- [x] Child alpha app manifests exist for `common`, `api`, `web`, `management-api`, `management-web`, `db`, `keyvaldb`, and `ops`.
- [x] Child source paths are in-repo alpha overlays under `infra/k8s/alpha/<component>/`.
- [x] Alpha overlays exist for each child source path and compose from `infra/k8s/base/<component>/` where applicable.
- [x] Alpha docs no longer describe `infra/k8s/alpha/` as scaffold-only.
- [x] Argo guidance skill references both local and alpha app-of-apps source paths.

## Intentional Divergences

- Metaboost alpha child set excludes Podverse-specific workloads (`workers`, `mq`, `cron`, `management-db`) because those components are not part of the current Metaboost base component model.
- Metaboost alpha app-of-apps and alpha child overlays pin immutable Git revisions (tag or commit SHA) in committed manifests.
- Metaboost alpha `ops` overlay composes from in-repo `../../base/ops` because `infra/k8s/base/ops` is not currently published on the remote refs used for Kustomize remote bases.
- Local-only Argo manifests under `infra/k8s/local-application.yaml` and `infra/k8s/argocd/metaboost-local-stack-application.yaml` remain on `targetRevision: develop` for manual local sync workflows.
