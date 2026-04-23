# Plan 03: Public Bucket Endpoint and Exchange Rates Route (apps/api)

## Scope

Add integration tests for the public bucket endpoint and the exchange rates route in `apps/api`. The public bucket GET has no test coverage. Exchange rates has service-level tests but no route-level integration test.

Routes under test:
- `GET /v1/buckets/public/:id` - Get public bucket without auth (public endpoint)
- `GET /v1/exchange-rates` - Get public exchange rates

Reference: `apps/api/src/routes/buckets.ts` line 40, `apps/api/src/routes/exchangeRates.ts`

## Test File

Create: `apps/api/src/test/public-bucket-and-exchange-rates.test.ts`

## Steps

1. Create test file with `FILE_PREFIX = 'pub-bucket'`
2. In `beforeAll`: create test app, create owner user, create public bucket, create private bucket
3. Test `GET /buckets/public/:id`:
   - Returns 200 with bucket details for public bucket without auth
   - Returns 404 for nonexistent bucket
   - Returns appropriate error for private bucket (non-public)
4. Test `GET /exchange-rates`:
   - Returns 200 with exchange rate data (may need to mock external API calls)
   - Returns expected structure (rates object)

## Key Files

- `apps/api/src/routes/buckets.ts` line 40 (public bucket route)
- `apps/api/src/controllers/publicBucketsController.ts`
- `apps/api/src/routes/exchangeRates.ts`
- `apps/api/src/controllers/exchangeRatesController.ts`
- Existing pattern: `apps/api/src/test/buckets.test.ts`

## Verification

```bash
./scripts/nix/with-env npm run test -w apps/api -- src/test/public-bucket-and-exchange-rates.test.ts
```
