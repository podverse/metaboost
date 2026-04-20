# 03 - Conversion Service and Currency Catalog

## Scope
Define supported currencies, provider-safe conversion behavior, and server-side cached exchange-rate conversion utilities.

## Steps
1. Introduce a hardcoded supported-currency catalog in API code:
   - ordered list starts with `USD`, `BTC` (satoshis-only mode)
   - followed by major fiat currencies supported by provider.
2. Add a denomination registry for each supported currency:
   - canonical unit code(s),
   - minor-unit exponent,
   - normalization rules from request payload to canonical minor units.
3. Enforce strict denomination parsing:
   - require `amount_unit` for all supported currencies,
   - reject missing/ambiguous unit values,
   - no backward-compatibility assumptions for legacy payloads.
4. Validate provider compatibility for each catalog currency and trim catalog to reliable subset.
5. Extend/refactor exchange-rate service:
   - env-configurable server standard/base currency (default `USD`)
   - cache TTL and refresh semantics
   - conversion helpers to and from bucket preferred currency.
6. Ensure BTC conversion is satoshi-based only (no alternate BTC unit modes).
7. Add error handling for unavailable rates and stale cache boundaries.
8. Standardize numeric conversion policy:
   - convert to target currency minor unit
   - round half-up to nearest integer minor unit
   - use integer minor units for all threshold comparisons.

## Key Files
- `apps/api/src/lib/exchangeRates.ts`
- new/adjacent files under `apps/api/src/lib/` for currency catalog + conversion helpers
- config + env validation files in `apps/api/src/config/*`

## Verification
- Unit/integration checks show all configured catalog currencies are provider-supported.
- Cached conversion works across USD/BTC/major fiat pairs.
- Service does not require USD hardcoding for server default behavior.
