---
name: metaboost-k8s-kustomize
description: Kustomize bases vs overlays under infra/k8s — no sibling ../ bases in component kustomizations; shared bundles (e.g. product-membership) composed in alpha/common with matching remote ?ref=. Use when editing infra/k8s kustomization.yaml, alpha overlays, or GitOps remote resources.
version: 1.0.1
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

- In-repo: list **`base/product-membership`** under **`infra/k8s/alpha/common/`** (with **`namespace: metaboost-alpha`** and the **same** `?ref=` as other remote bases). **`alpha/api`** and **`alpha/management-api`** list only their **`base/<component>`** URL — Deployments still **`envFrom`** `metaboost-product-membership-config`.
- External GitOps: same pattern — **`common`** overlay owns **`product-membership`**; workload overlays do not duplicate it (see [METABOOST-PUBLISH-GITOPS-BUMP-CHECKLIST.md](/docs/development/release/METABOOST-PUBLISH-GITOPS-BUMP-CHECKLIST.md)).

## Value types in YAML and ConfigMap env

- **`source/*.env`:** unquoted values for `configMapGenerator` (see **env-file-formatting** skill and
  [INFRA-K8S-BASE.md](/infra/k8s/INFRA-K8S-BASE.md)).
- **YAML string fields:** double-quoted scalars OK (Prettier under `infra/k8s/`).
- **YAML integer/float fields:** unquoted numbers (`replicas: 1`, `containerPort: 4000`); never
  `"1"` where OpenAPI expects a numeric type.
- **`containers[].env[].value`:** string in the API — `value: "5432"` remains valid for env overrides.

## References

- [infra/k8s/INFRA-K8S.md](/infra/k8s/INFRA-K8S.md) — layout, revision policy, cross-component bases
- [infra/k8s/INFRA-K8S-BASE.md](/infra/k8s/INFRA-K8S-BASE.md) — per-directory table
- [docs/development/k8s/REMOTE-K8S-GITOPS.md](/docs/development/k8s/REMOTE-K8S-GITOPS.md) — remote URLs and safety workflow
- **argocd-gitops-push** skill — push reminder when changing `infra/k8s/`

## Build flags

Use `kubectl kustomize ... --load-restrictor LoadRestrictionsNone` when building overlays that reference paths outside the current folder (see INFRA-K8S-BASE.md).
