# Metaboost Bucket Currency Threshold - Summary

## Scope
- Replace USD-only message-threshold semantics with bucket-preferred-currency semantics.
- Add per-bucket standard currency and minimum message amount settings (cascading and editable on descendants).
- Keep server-wide default currency configurable via env (default `USD` in env and k8s defaults).
- Add a public conversion endpoint that converts arbitrary supported currency into a bucket's preferred currency.
- Return conversion endpoint URL from bucket GET responses for app consumption.
- Harden threshold filtering performance to avoid full-candidate in-memory scans on large buckets.
- Replace legacy query naming (`minimumAmountUsdCents`) with `minimumAmountMinor` as the canonical list/read threshold query parameter.
- Explicitly document legacy/non-convertible row behavior when threshold filters are active.
- Add a public Metaboost web route showing cached exchange rates plus a calculator.
- Update Podverse v4v boost-form UX globally (all Metaboost-enabled forms) to gate name/message inputs when send amount is below bucket minimum.
- Standardize Podverse boost amount-input formatting by currency (decimal precision + symbol prefix), including integer-only behavior for BTC/satoshis and zero-decimal fiat currencies.

## Core Rules
- Every bucket has a minimum threshold defaulting to `0`.
- Every bucket has a preferred/standard currency.
- Top-level updates can cascade to descendants, with apply-to-descendants confirmation flow.
- Threshold applies to both:
  - donate-form message eligibility (input gating), and
  - relevant message-list/read endpoints (server-side filtering).
- Currency catalog is hardcoded on server:
  - top options: `USD`, `BTC` (satoshis only)
  - then major fiat currencies supported by the selected FX provider.
- Server base/default standard currency is env-driven (default `USD`), not hardcoded in logic.
- Conversion policy: round to nearest minor unit (half-up), then compare integer minor units.
- List/read threshold query contract uses `minimumAmountMinor` (minor units); `minimumAmountUsdCents` is removed as part of this plan set.
- Denomination policy is strict:
  - `amount_unit` is required for all supported currencies.
  - no ambiguous defaults for missing units.
  - BTC supports satoshis only for this feature.
- Legacy/non-convertible message rows are excluded when an effective threshold greater than `0` is applied.
- Implementation uses clean-slate schema updates in init SQL:
  - update `CREATE TABLE` definitions directly.
  - do not include backward-compat migration/`ALTER TABLE` strategy for this plan set.

## Primary Technical Areas
- **Schema/ORM**: bucket settings fields for threshold + preferred currency; migration away from USD-specific naming.
- **Bucket API**: update/get payloads, cascade behavior, and conversion endpoint URL in responses.
- **FX Service**: provider compatibility, cache strategy, supported currency registry, and conversion helpers in shared package `@metaboost/helpers-currency`.
- **Public API**: conversion endpoint for apps.
- **Threshold filtering hardening**: SQL-backed filter path and query contract rename for scale and consistency.
- **Metaboost Web**: public exchange-rate + calculator page.
- **Podverse Web**: donate page threshold gating and conversion-aware helper messaging.
  - Applies to all v4v boost forms when Metaboost is enabled (`mb-v1` and `mbrss-v1`).
  - Currency-aware amount input formatting must derive decimal precision from denomination metadata and prefix the selected currency symbol where applicable.
  - Execution is split strictly across plans `11` (shared utility contract), `12` (form integration), and `13` (validation + i18n + E2E hardening).
- **Contracts/Docs/Env**: OpenAPI, docs, env defaults, k8s wiring.

## Key Repositories and File Areas
- **Metaboost**
  - `infra/k8s/base/db/postgres-init/0003_app_schema.sql`
  - `packages/orm/src/entities/*`, `packages/orm/src/services/BucketService.ts`
  - `apps/api/src/controllers/*`, `apps/api/src/schemas/*`, `apps/api/src/openapi-*.ts`
  - `apps/api/src/lib/exchangeRates.ts`
  - `packages/helpers-currency/src/*` (shared currency catalog, denomination, and conversion primitives)
  - `apps/web/src/app/**` (new public calculator route)
  - env + k8s defaults (`infra/config/**`, deployment manifests, startup validation)
- **Podverse**
  - `apps/web/src/app/donate/page.tsx`
  - `apps/web/src/app/podcast/[channel_id]/PodcastPageList.tsx`
  - `apps/web/src/app/episode/[item_id]/EpisodePageList.tsx`
  - `apps/web/src/components/Boost/*`
  - `apps/web/src/components/Boost/messages/*`
  - `packages/v4v-metaboost/src/publicMessages.ts`
  - `apps/web/i18n/**`

## Decisions Recorded
- Use integer minor units for thresholds where possible (fiat cents; BTC satoshis) to avoid float comparison issues.
- Keep conversion-rates cache server-side and reuse existing exchange-rate infrastructure where reliable.
- Keep donate threshold enforcement as a front-end UX gate, with authoritative threshold and conversion source from Metaboost APIs.
- Enforce strict denomination syntax (no backward compatibility for missing/legacy unit behavior).
- Prefer SQL-backed threshold filtering paths over loading all candidate messages into memory for list/read endpoints.
- Use `minimumAmountMinor` as the threshold query parameter name so API contracts match preferred-currency minor-unit semantics.
