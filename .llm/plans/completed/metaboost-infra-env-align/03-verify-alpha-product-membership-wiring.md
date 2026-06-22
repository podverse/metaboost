# 03 — Verify alpha product-membership wiring

## Scope

Pending change moves `base/product-membership` remote resource from `alpha/api` to `alpha/common`.
Docs in `INFRA-K8S-BASE.md` already updated. Verify GitOps child apps still mount config correctly.

## Steps

1. Confirm `alpha/common/kustomization.yaml` includes product-membership remote base.
2. Confirm `alpha/api/kustomization.yaml` no longer duplicates product-membership (api uses
   envFrom referencing shared ConfigMap).
3. Run `kustomize build` for `infra/k8s/alpha/common` and `infra/k8s/alpha/api` (or rely on
   `metaboost-infra-alpha-contracts.yml` CI workflow).
4. Update `ARGOCD-GITOPS-METABOOST.md` if operator steps changed.

## Verification

```bash
kustomize build --load-restrictor LoadRestrictionsNone infra/k8s/alpha/common >/dev/null
kustomize build --load-restrictor LoadRestrictionsNone infra/k8s/alpha/api >/dev/null
```

## Argo CD

After merge, push to GitOps branch and sync `metaboost-alpha` apps per **argocd-gitops-push**.
