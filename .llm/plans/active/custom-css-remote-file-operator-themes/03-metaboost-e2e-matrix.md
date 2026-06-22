# 03 — Metaboost E2E matrix

## Required matrix

1. No custom theme file configured.
2. Only custom theme file configured (no `NEXT_PUBLIC_SUPPORTED_THEMES` and no `NEXT_PUBLIC_DEFAULT_THEME`).
3. Custom theme file with `NEXT_PUBLIC_SUPPORTED_THEMES` and `NEXT_PUBLIC_DEFAULT_THEME`.
4. Custom URL configured but remote fetch fails or payload is invalid.

## Assertions

- Custom themes appear in selectors when custom file resolves.
- First custom theme is default when custom file resolves.
- `NEXT_PUBLIC_DEFAULT_THEME` is ignored only in resolved-custom mode.
- Failure path restores built-in/default behavior.
- First render shows expected theme values (no flash regression).
