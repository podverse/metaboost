# Tests

This phase was not fully completed in the original execution pass.
Its remaining scope is now consolidated into:

- `.llm/plans/active/mb-v1-gap-closure/01-api-standard-parity-tests.md`
- `.llm/plans/active/mb-v1-gap-closure/02-api-bucket-policy-matrix-tests.md`
- `.llm/plans/active/mb-v1-gap-closure/03-web-e2e-custom-endpoint-and-children.md`
- `.llm/plans/active/mb-v1-gap-closure/04-management-parity-and-regression-guards.md`

Original intent:

- `mb-v1-spec-contract.test.ts`, extend HTTPS/CORS/app-assertion for `/standard/mb-v1`.
- `buckets.test.ts`: mb hierarchy + cross-family rejects.
- E2E: Custom create + Endpoint tab.
- management-api unions where needed.
