# 09 - Consumer Integration Examples

## Scope

Add framework-agnostic consumer examples showing how third-party backend APIs integrate the signing helpers package.

Examples must use **`POST`** requests to **`/v1/standard/*`** (e.g. MBRSS paths under `/v1/standard/mbrss-v1/...`), not legacy `/v1/s/`.

## Outcomes

- Integrators have copy-paste-ready examples for common backend request flows.
- Examples demonstrate secure key handling patterns and clear anti-patterns.
- Helper package ergonomics is validated against real integration scenarios.

## Steps

1. Create example set for backend-only usage:
   - basic signed POST helper;
   - reusable request wrapper;
   - error-handling and retry pattern.
2. Add examples for common HTTP clients (framework-agnostic approach):
   - native `fetch` request options;
   - generic request options shape reusable by axios/got wrappers.
3. Add security examples:
   - load key from env/secret store;
   - never expose key to client runtime;
   - rotate key workflow stub.
4. Add expected-output fixtures to validate claims and headers.

## Suggested File Targets

- [`/Users/mitcheldowney/repos/pv/metaboost/docs/api/`](file:///Users/mitcheldowney/repos/pv/metaboost/docs/api/)
- [`/Users/mitcheldowney/repos/pv/metaboost/packages/`](file:///Users/mitcheldowney/repos/pv/metaboost/packages/)

## Verification

- Example code paths compile and produce expected assertion structure.
- Fixtures confirm `m`, `p`, and `bh` compatibility with verifier.
- Security guidance remains framework-agnostic and backend-only.
