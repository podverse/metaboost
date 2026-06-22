# 01 — Contract parity

## Objective

Mirror the shared remote custom-theme contract and behavior rules from the coordinating Podverse plan set.

## Must match exactly

- URL policy: allow `https://*` plus local dev HTTP (`http://localhost`, `http://127.0.0.1`).
- Precedence: when custom file resolves, first custom theme is default and `NEXT_PUBLIC_DEFAULT_THEME` is ignored.
- Failure behavior: if custom URL is set but fetch/validation fails, fall back to built-in themes and normal `NEXT_PUBLIC_DEFAULT_THEME`.
- Include test-assets fixture(s) for local HTTP serving and E2E.
