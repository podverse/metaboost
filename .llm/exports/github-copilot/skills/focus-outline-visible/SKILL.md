---
name: focus-outline-visible
description: Ensure the entire focus indicator is visible for buttons and button-like focusable elements; use padding + reverse margin when layout must stay unchanged.
version: 1.0.0
---


# Focus outline visibility

**When to use:** When adding or changing buttons, links, tabs, or any focusable (clickable) component in `@metaboost/ui` or app code that receives keyboard focus and shows a focus ring.

## Rule

Every button and button-like component or element that can receive focus must have enough space around it so that when it has focus, the **entire** focus indicator is visible (not clipped).

- Focus rings typically use `outline` + `outline-offset` (or box-shadow). The ring extends **outside** the element by `$focus-outline-width + $focus-outline-offset` (see `packages/ui/src/styles/_variables.scss`), usually 4px.
- Any parent with `overflow: hidden`, `overflow: auto`, or `overflow: scroll` can clip that ring.
- **Fix:** Give the container that has overflow enough **padding** (or give the focusable enough **margin**) so the ring has room—at least `$focus-outline-width + $focus-outline-offset` in each direction that could clip.

### Keeping page spacing unchanged (reverse margin)

When you need the **resulting spacing on the page to stay the same** but still need room inside the scroll/overflow container for the focus ring:

1. Add **padding** to the scroll/overflow container: `padding: ($focus-outline-width + $focus-outline-offset) 0;` (vertical) or the same for horizontal as needed.
2. Add an **equal negative margin** to the same element: `margin: -($focus-outline-width + $focus-outline-offset) 0;`.

Effect: the focusable content has internal room so the outline is not clipped; the negative margin pulls the block back so the row/section does not take up extra space and the page layout looks the same. Use this for horizontal tab rows in a scroll wrapper, or any overflow container where visual spacing must be preserved.

## Checklist

- Does this component or its wrapper use overflow (hidden/auto/scroll)? If yes, is the focus ring fully visible when focused?
- If the ring is clipped, add padding (and optionally reverse margin) so the ring is not clipped.
- For new focusable components, ensure containers that use overflow leave room for the focus ring (padding or margin at least `$focus-outline-width + $focus-outline-offset`).
