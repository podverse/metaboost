# 01 — Sync k8s env sources with templates

## Scope

Triage found `infra/config/env-templates/` and `apps/*/ .env.example` include **WEBPUSH_** keys but
`infra/k8s/base/api/source/api.env` does not yet. Align k8s ConfigMap sources with canonical templates
per **env-file-formatting** skill.

## Files

| Source (k8s base) | Template |
| --- | --- |
| `infra/k8s/base/api/source/api.env` | `infra/config/env-templates/api.env.example` |
| `infra/k8s/base/web/source/web-sidecar.env` | `infra/config/env-templates/web-sidecar.env.example` |
| `infra/k8s/base/management-api/source/management-api.env` | `infra/config/env-templates/management-api.env.example` |
| `infra/k8s/base/management-web/source/management-web-sidecar.env` | sidecar template if exists |

Also confirm `API_RELEASE` / `READINESS_API_EXPECTED_RELEASE` use consistent `X.Y.Z-staging.N`
placeholders across base + alpha apps (pending diff already does this — **KEEP**).

## Steps

1. Add WEBPUSH keys to k8s base env files matching template order/comments (empty values for secrets).
2. Add `NEXT_PUBLIC_WEBPUSH_*` to `web-sidecar.env` if missing vs template.
3. Do not hand-edit generated gz or migration SQL in this plan (plan 02).

## Verification

```bash
diff <(grep -E '^[A-Z]' infra/config/env-templates/api.env.example | cut -d= -f1) <(grep -E '^[A-Z]' infra/k8s/base/api/source/api.env | tr '=' ' ' | awk '{print $1}' | sed 's/$/=/') || true
```
