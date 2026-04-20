# 05 - Metaboost Web Exchange Rates Page

## Scope
Create a public, direct-linkable Metaboost web page that displays cached exchange rates and a simple calculator.

## Steps
1. Add a public route in `apps/web` (no auth) for exchange rates + calculator.
2. Build UI with:
   - currency dropdown (supported catalog order: USD, BTC sats, then fiat list)
   - amount input
   - calculate action
   - results table showing converted values across cached currencies.
3. Fetch rates/conversion data from API endpoint(s) using helper request patterns.
4. Show cache freshness timestamp and graceful error/empty states.
5. Ensure i18n keys are added for page labels/messages.

## Key Files
- `apps/web/src/app/**` new route files
- `apps/web/src/components/**` new calculator/table components as needed
- `packages/helpers-requests/src/web/**` request helpers for exchange-rate route(s)
- `apps/web/i18n/originals/*.json` and corresponding overrides

## Verification
- Route is publicly accessible by direct URL.
- Calculator returns expected values for USD/BTC/major fiat scenarios.
- Table renders all cached currency conversions from server response.
