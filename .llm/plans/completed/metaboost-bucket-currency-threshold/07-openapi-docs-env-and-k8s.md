# 07 - OpenAPI, Docs, Env, and K8s

## Scope
Finalize API/docs/config contracts for the new currency-threshold model and server-default currency behavior.

## Steps
1. Update OpenAPI specs for:
   - bucket preferred currency + threshold fields
   - conversion endpoint request/response schemas
   - bucket response conversion URL field.
   - strict denomination requirements (`amount_unit` required and enum/validation per currency policy).
2. Update integration docs for app developers (how to fetch bucket settings and call conversion endpoint).
3. Add/rename env vars for server default standard currency (default `USD`).
   - include current exchange-rate runtime vars in docs and env templates:
     - `API_EXCHANGE_RATES_SERVER_STANDARD_CURRENCY`
     - `API_EXCHANGE_RATES_FIAT_BASE_CURRENCY`
     - `API_EXCHANGE_RATES_CACHE_TTL_MS`
     - `API_EXCHANGE_RATES_MAX_STALE_MS`
4. Align defaults across env files, scripts, and k8s manifests/renderers.
5. Ensure startup validation enforces supported default currency.

## Key Files
- `apps/api/src/openapi*.ts`
- `apps/management-api/src/openapi.ts`
- `apps/api/src/config/index.ts`
- `packages/helpers-currency/src/*`
- `docs/**/*.md` (Metaboost API/spec docs)
- env defaults and classification files (`infra/config/**`, scripts/env handling)
- k8s manifests/templates under `infra/k8s/**`

## Verification
- OpenAPI includes all new fields and endpoint parameters.
- Docs describe conversion/threshold behavior clearly for app integrators.
- Local/dev/k8s defaults resolve server standard currency to `USD` unless overridden.
