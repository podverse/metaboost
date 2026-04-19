# 02 - Create-Time USD Conversion

## Scope
Assign USD cents snapshot at message creation time and persist it once.

## Steps
1. Extend shared ingest persistence in `apps/api/src/lib/standardIngest/persistBoostMessage.ts`:
   - Fetch exchange rates via `getExchangeRates()`.
   - Convert incoming amount/currency/unit to USD baseline.
2. Define conversion policy:
   - `usdMajor * 100`, rounded to nearest integer cent (`Math.round`).
   - Non-convertible or unavailable rates result in `null` snapshot.
3. Pass `usdCentsAtCreate` into `BucketMessageService.create`.
4. Ensure both `mb-v1` and `mbrss-v1` create endpoints keep using the same shared persistence path.
5. Keep conversion write-once:
   - No update path should mutate snapshot after insert.

## Key Files
- `apps/api/src/lib/standardIngest/persistBoostMessage.ts`
- `apps/api/src/lib/exchangeRates.ts`
- `packages/orm/src/services/BucketMessageService.ts`
- `apps/api/src/controllers/mbV1Controller.ts`
- `apps/api/src/controllers/mbrssV1Controller.ts`

## Verification
- Create requests continue to succeed for BTC and USD payloads.
- Created rows include expected `usd_cents_at_create` when rates are available.
- Existing rows are untouched.
