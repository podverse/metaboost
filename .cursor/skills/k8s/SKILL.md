---
name: metaboost-k8s-kustomize
description: Kustomize bases vs overlays under infra/k8s — no sibling ../ bases in component kustomizations; shared bundles (e.g. product-membership) composed in overlays with matching remote ?ref=. Use when editing infra/k8s kustomization.yaml, alpha overlays, or GitOps remote resources.
---

# Metaboost Kubernetes / Kustomize

## When to use

- Editing `infra/k8s/base/**/kustomization.yaml` or `infra/k8s/alpha/**/kustomization.yaml`
- Adding shared ConfigMaps or cross-cutting env that multiple workloads consume
- Aligning in-repo alpha with external GitOps overlay patterns

## Bases stay self-contained (Podverse-style)

- Do **not** add `resources: - ../other-base` inside `infra/k8s/base/<component>/` to pull a sibling directory. That couples bases and breaks clean remote-Git consumption.
- **`base/product-membership/`** generates `metaboost-product-membership-config`. **api** and **management-api** Deployments reference it, but their **`base/<component>/kustomization.yaml`** lists only that component’s YAML + its own `configMapGenerator` — not `product-membership`.

## Compose shared bundles in overlays

- In-repo: **`infra/k8s/alpha/api/`** and **`infra/k8s/alpha/management-api/`** list **two** remote `resources:` entries — `base/<component>` and **`base/product-membership`** — with the **same** `?ref=` tag as the primary base.
- External GitOps: same pattern in `apps/metaboost-alpha/api/` and `.../management-api/` (see [METABOOST-PUBLISH-GITOPS-BUMP-CHECKLIST.md](../../../docs/development/release/METABOOST-PUBLISH-GITOPS-BUMP-CHECKLIST.md)).

## References

- [infra/k8s/INFRA-K8S.md](../../../infra/k8s/INFRA-K8S.md) — layout, revision policy, cross-component bases
- [infra/k8s/INFRA-K8S-BASE.md](../../../infra/k8s/INFRA-K8S-BASE.md) — per-directory table
- [docs/development/k8s/REMOTE-K8S-GITOPS.md](../../../docs/development/k8s/REMOTE-K8S-GITOPS.md) — remote URLs and safety workflow
- **argocd-gitops-push** skill — push reminder when changing `infra/k8s/`

## Build flags

Use `kubectl kustomize ... --load-restrictor LoadRestrictionsNone` when building overlays that reference paths outside the current folder (see INFRA-K8S-BASE.md).
