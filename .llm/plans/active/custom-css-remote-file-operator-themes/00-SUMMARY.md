# Metaboost mirror plan — operator remote custom themes

## Status

Deferred mirror plan set for cross-repo alignment with Podverse custom remote theme work.

## Source plan set

Primary coordinating plan set lives in:

- `/Users/mitcheldowney/repos/pv/podverse-custom-css-remote-file/.llm/plans/active/custom-css-remote-file-operator-themes`

## Locked behavior

- Allow remote URL from `https://*` plus local HTTP only (`http://localhost`, `http://127.0.0.1`).
- If custom file resolves, first custom theme is default and `NEXT_PUBLIC_DEFAULT_THEME` is ignored.
- If custom URL is set but fetch/validation fails, fall back to built-in theme behavior and normal `NEXT_PUBLIC_DEFAULT_THEME` handling.
- Include test-assets fixture(s) for local HTTP serving and E2E.

## Deferred execution note

Do not execute implementation from this mirror plan set until explicitly scheduled. Keep this set synchronized with the Podverse coordinating plan.
