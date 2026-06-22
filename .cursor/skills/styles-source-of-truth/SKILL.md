---
name: styles-source-of-truth
description: Design tokens, themes, mixins, and reset live in @metaboost/ui. Apps consume them via @metaboost/ui/styles/* — do not duplicate tokens in app SCSS.
---

# styles-source-of-truth

## Source of truth

`packages/ui/src/styles/` is the canonical home for:

- Design tokens (SCSS variables + CSS custom properties): `_variables.scss`
- Themes on **`[data-theme]`** (`light`, `dark`, `dracula`): `_themes.scss`
- Shared SCSS mixins: `_mixins.scss`
- CSS reset: `_reset.scss`

## Usage in apps

```scss
@use '@metaboost/ui/styles/variables' as *;
@use '@metaboost/ui/styles/mixins' as *;
@use '@metaboost/ui/styles/themes';
@use '@metaboost/ui/styles/reset';
```

Use CSS variables in module SCSS:

```scss
.card {
  padding: $space-4;
  color: var(--color-text);
  background-color: var(--color-bg);
}
```

## Rules

- **No `var()` fallbacks:** Do not use `var(--token, fallback)` in SCSS/CSS (see **css-custom-properties-no-var-fallbacks** rule). Missing tokens belong in `_variables.scss` / `_themes.scss`, not masked with a second `var()` argument.
- **Buttons and controls:** Never rely on the browser default `<button>` background. Always set `background-color` and `color` using theme tokens so variants stay readable on **every** `[data-theme]` (`light`, `dark`, `dracula`).
- Do **not** add new tokens to `apps/web/src/styles/...` or `apps/management-web/src/styles/...` except app layout glue that imports package styles. Add tokens in `packages/ui/src/styles/_variables.scss` (and `_themes.scss` if theme-dependent).
- If page/module styles repeat across multiple pages (forms, table wrappers, badges, header action rows), prefer a reusable React component in `@metaboost/ui` rather than duplicated SCSS blocks.
- Theme-dependent values (colors, surfaces, button states) **must** be defined in **every** built-in theme block in `_themes.scss` (`light`, `dark`, `dracula`).
- Non-theme values (spacing, radii, dialog widths, etc.) live in `_variables.scss`.
- Default theme: **`light`** on `:root` and `[data-theme='light']`; apps set `data-theme` on a root wrapper.
- If you change a value used by both apps, change it in `packages/ui/src/styles/` and verify web and management-web E2E smoke targets.

## When to break this skill

Never. Token duplication is the bug class this skill exists to prevent.
