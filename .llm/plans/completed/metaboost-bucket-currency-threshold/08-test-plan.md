# 08 - Test Plan

## Scope
Define required integration and E2E coverage for Metaboost + Podverse changes.

## Integration Tests (API/Management-API)
1. Bucket settings:
   - create/update/get includes preferred currency + minimum threshold.
   - defaults are `minimum=0` and server-default currency.
   - descendant update + apply-to-descendants behavior mirrors char limit semantics.
2. Conversion service:
   - supported currency validation.
   - strict denomination validation (`amount_unit` required) and rejection of ambiguous payloads.
   - same-currency identity conversion.
   - USD/BTC/fiat conversion correctness with cached rates.
   - non-USD fiat base configuration (for example `API_EXCHANGE_RATES_FIAT_BASE_CURRENCY=EUR`) still returns correct BTC/fiat conversions and baseline selection behavior.
3. Conversion endpoint:
   - returns converted value in bucket preferred currency.
   - handles unsupported currency and unavailable rate edge cases.
   - verifies round-half-up minor-unit behavior.
4. Bucket response contract:
   - includes conversion endpoint URL.
5. Message list filtering:
   - relevant list/read endpoints enforce bucket threshold via SQL-backed filtering (no full candidate in-memory filtering requirement).
   - query contract uses `minimumAmountMinor` and no longer accepts `minimumAmountUsdCents`.
   - pagination totals remain coherent after filtering.
6. Legacy row behavior under active threshold:
   - when effective threshold is greater than `0`, rows missing/non-convertible threshold basis are excluded.
   - when no threshold is active, those rows can still appear in list/read results.

## E2E Tests (Metaboost web + management-web)
1. Bucket settings forms:
   - preferred currency dropdown order (`USD`, `BTC sats`, then fiat list).
   - minimum threshold edit + persist + apply-to-descendants prompt flow.
2. Public exchange-rates/calculator page:
   - direct URL access, calculate action, and result table rendering.

## E2E Tests (Podverse web)
1. All Metaboost-enabled v4v boost forms (`mb-v1` and `mbrss-v1`), including donate/podcast/episode:
   - below-threshold amount disables Name/Message inputs.
   - threshold warning text renders with threshold and converted value placeholders filled.
   - above-threshold amount re-enables Name/Message inputs.
   - same-currency path avoids conversion request; cross-currency path uses conversion endpoint.
   - forms provide explicit denomination data; missing/invalid denomination yields deterministic error UX (no implicit unit guessing).
   - currency-specific amount-input precision:
     - BTC/satoshis path rejects decimals (integer only).
     - 2-decimal currencies (for example USD/EUR) accept exactly bounded decimal precision and serialize to minor units correctly.
     - zero-decimal currencies (for example JPY/KRW) reject decimal fractions.
   - currency symbol prefix behavior:
     - selected fiat currency shows expected symbol prefix in input UI.
     - BTC/satoshis path shows no symbol prefix.

## Suggested Test File Targets
- `apps/api/src/test/*.test.ts`
- `apps/management-api/src/test/*.test.ts`
- `apps/web/e2e/*.spec.ts` (Metaboost)
- `apps/management-web/e2e/*.spec.ts` (Metaboost)
- Podverse repo: `apps/web/e2e/*.spec.ts`

## Verification Commands (for later execution by user)
```bash
make e2e_test_web_report_spec SPEC=e2e/<metaboost-web-spec>.spec.ts
make e2e_test_management_web_report_spec SPEC=e2e/<metaboost-management-spec>.spec.ts
```
