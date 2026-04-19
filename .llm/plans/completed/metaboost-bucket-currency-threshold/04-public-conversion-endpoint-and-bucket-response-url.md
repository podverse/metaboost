# 04 - Public Conversion Endpoint and Bucket Response URL

## Scope
Add API endpoint(s) that convert arbitrary supported currency into a bucket's preferred currency using cached rates, and include discoverable URL in bucket GET responses.

## Steps
1. Add public conversion endpoint contract (API + management-api parity only if needed):
   - input: bucket identifier, source currency, source amount, source `amount_unit`
   - output: converted amount in bucket preferred currency, rate metadata/timestamp.
2. Wire endpoint to cached exchange-rate service from step 03.
3. Return endpoint URL in bucket response payloads consumed by clients.
4. Enforce supported currency validation with clear error payloads.
   - enforce strict denomination validation (`amount_unit` required and recognized).
5. Document conversion semantics:
   - if source currency == preferred currency, conversion is identity (no alternate path needed).
   - conversion output amount in minor units uses round-half-up policy.
   - BTC pricing path is fiat-base-aware (uses configured fiat base currency quote), not USD-pivot-only behavior.

6. Apply threshold filtering contract to message-list/read endpoints:
   - convert message amounts into bucket preferred currency minor units (cached rates),
   - filter rows by `>= minimumMessageAmountMinor`,
   - keep pagination totals coherent post-filter.

## Key Files
- `apps/api/src/controllers/*` (new controller or existing bucket/value controller)
- `apps/api/src/routes/*`
- `apps/api/src/lib/bucket-response.ts`
- `apps/api/src/lib/exchangeRates.ts`
- `packages/helpers-currency/src/*`
- `apps/management-api/src/lib/bucketToJson.ts` (if surfaced there too)
- shared request/response types in `packages/helpers-requests/*`

## Verification
- Endpoint returns deterministic conversion for USD/BTC/fiat test fixtures.
- Response includes bucket preferred currency and cache timestamp metadata.
- Bucket GET includes the conversion URL and clients can call it directly.
