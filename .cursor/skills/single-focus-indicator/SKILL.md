---
name: single-focus-indicator
description: Use exactly one visible focus indicator per focusable element; when using the focus-ring mixin, do not also change border or add a second outline.
version: 1.0.0
---

# Single focus indicator (no double focus)

**When to use:** When adding or changing focus styles on buttons, links, selects, inputs, or any focusable component in `@boilerplate/ui` or app code.

## Rule

Use **exactly one** visible focus indicator per focusable element. Do not combine multiple indicators (e.g. outline **and** border-color change, or outline **and** box-shadow) on the same element when focused.

- When using the `focus-ring` mixin (`@include focus-ring` from `packages/ui/src/styles/_mixins.scss`), do **not** also change `border-color` or add a second outline/ring on `:focus` or `:focus-visible`. The mixin already provides an outline; adding a border-color change causes a "double focus" (inner border + outer outline).
- If you need a custom focus style, use a single mechanism: either the mixin’s outline, or only border, or only box-shadow—not more than one.
- Keep `outline: none` on `:focus` only to suppress the browser default; then use `:focus-visible` (e.g. via the mixin) for the one visible indicator so keyboard users get a clear ring.

## Checklist

- Does this component set both an outline/ring and a border (or box-shadow) change on focus? If yes, remove one.
- When using `@include focus-ring`, is there a separate `&:focus { border-color: ... }` (or similar)? If yes, remove the border-color (or other second indicator) so only the focus-ring outline shows.
- Prefer `:focus-visible` and the shared `focus-ring` mixin for keyboard-visible focus.
