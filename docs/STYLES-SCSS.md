# Styles and SCSS

SCSS is used for styling. Shared variables and mixins live in the **@metaboost/ui** package;
app-specific SCSS lives in each app (e.g. `apps/web/src/styles/`).

## Shared package (`@metaboost/ui`)

- **Variables:** `src/styles/_variables.scss` (colors, spacing, breakpoints)
- **Mixins:** `src/styles/_mixins.scss` (clearfix, truncate, responsive breakpoints)
- **Layout:** `src/styles/_layout.scss` (`.container`, `.layout-main`, `.stack`, `.header-bar`) — mobile-first, uses breakpoint mixins. Use `@use '@metaboost/ui/styles/layout';` in app globals.
- **Themes:** `src/styles/_themes.scss` — CSS variables for `[data-theme="light"]` and `[data-theme="dark"]`. Use `@use '@metaboost/ui/styles/themes';` in app globals; wrap the app with `ThemeProvider` from `@metaboost/ui` so the theme wrapper has `data-theme`.
- **Usage in app or component SCSS:**

  ```scss
  @use '@metaboost/ui/styles/variables' as *;
  @use '@metaboost/ui/styles/mixins' as *;
  ```

## App-specific SCSS

- **Web app:** `apps/web/src/styles/` — e.g. `globals.scss` for global base styles.
  Import shared variables/mixins from `@metaboost/ui` and add app-only rules.
- Use **CSS modules** (`.module.scss`) for component-scoped styles; keep style imports **last** in the file.

## Import order (styles last)

In every component or page file, place **style imports last** (after React, other components, utils).
Example:

```tsx
import { getRuntimeConfig } from '../config/runtime-config-store';

import styles from './page.module.scss';
```

This keeps style overrides predictable and matches project convention.
