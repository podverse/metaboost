# MetaBoost infra env align — Summary

## Purpose

Complete MetaBoost k8s/env ops alignment after triage Plan 06: env source/template sync, linear
baseline regeneration, and alpha GitOps wiring. **Push to Argo CD branch after `infra/k8s/**`
changes** (see `argocd-gitops-push` skill).

## Plans

| File | Focus |
| --- | --- |
| 01-sync-k8s-env-sources-with-templates.md | WEBPUSH + release placeholder parity |
| 02-regenerate-linear-baseline-gz.md | Regenerate `0003a_app_linear_baseline.sql.gz` after SQL ops changes |
| 03-verify-alpha-product-membership-wiring.md | Confirm `alpha/common` owns product-membership remote base |

## Verification

```bash
grep WEBPUSH infra/k8s/base/api/source/api.env infra/config/env-templates/api.env.example
make help_test
```
