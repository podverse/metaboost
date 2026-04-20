# 06c - Podverse Threshold Gating (Donate Form)

## Scope
Implement threshold gating UX on donate form using bucket context + conversion helper.

## Steps
1. In donate form, derive current send amount as normalized integer minor amount.
2. Determine current send amount currency and explicit `amount_unit` from form state/metadata.
3. Compare against bucket threshold:
   - same-currency: compare directly
   - cross-currency: call conversion helper, then compare converted minor amount
4. Disable `Name` and `Message` inputs when below threshold.
5. Show exact copy:
   - `The minimum amount to send a message with your donation is _____ (converted value: _____).`
6. Keep non-MetaBoost donate behavior unchanged.

## Key Files (Podverse repo)
- `apps/web/src/app/donate/page.tsx`
- `apps/web/src/components/Boost/BoostAppDonateForm.tsx`
- `apps/web/src/components/Boost/*` shared amount/value helpers

## Verification
- Below-threshold amounts disable name/message fields and show the required message.
- Above-threshold amounts enable inputs.
- Same-currency case does not trigger conversion network call.
