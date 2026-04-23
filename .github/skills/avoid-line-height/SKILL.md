---
name: avoid-line-height
description: Do not change line-height; use normal line height for text. Control spacing with gap, margin, padding, and layout components. Use when adding or editing styles, typography, or vertical rhythm in SCSS/CSS or UI components.
---

# Avoid Changing Line Height

**When to use:** When adding or editing styles (SCSS/CSS), typography, layout components, or when the user mentions line-height, vertical spacing, or text spacing.

## Rule

Do **not** set or change `line-height` on text elements. The project uses **normal line height** for text (from the reset on `html`/`body`). Line height should match the text itself; we do not use line-height to control vertical spacing.

## How to control spacing instead

- **Between lines of text:** Rely on `line-height: normal` (inherited). Do not add `line-height` to get more or less space.
- **Between blocks or elements:** Use **gap** (e.g. `Stack` with `gap`, flex/grid `gap`), **margin**, or **padding** on layout components.
- **Form controls / inputs:** The reset and component styles may keep inherited line-height; do not add line-height for spacing—use padding or min-height if needed for tap targets.
- **Vertical rhythm:** Use spacing tokens (`$space-*`, `$gap-standard`), `Stack`, and layout structure rather than line-height.

## Do not

- Add `line-height: 1.5`, `line-height: 1.2`, or any explicit line-height for “readability” or spacing.
- Override the root `line-height: normal` in globals or reset.
- Use line-height to fix alignment or spacing that should be solved with gap, margin, or padding.

## Exception

Only set `line-height` when a component has a **specific need** that cannot be met by gap/margin/padding (e.g. a single-line control that must have `line-height: 1` for precise height). Prefer leaving line-height unset so it inherits normal.
