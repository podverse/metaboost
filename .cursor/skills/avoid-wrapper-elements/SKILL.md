---
name: avoid-wrapper-elements
description: Avoid div and other element wrappers within pages that exist only to apply styles. Use when adding or reviewing page layout, spacing, or wrapper markup in apps (e.g. Next.js pages, React components).
---

# Avoid Wrapper Elements for Styling Only

**When to use:** When adding or editing page layout, spacing, or when you see a `<div>`, `<span>`, or similar wrapper that exists only to hold a `className` (e.g. for margin, padding, or flex).

## Rule

Do **not** add free-floating wrappers (div, span, etc.) whose sole purpose is to apply styles. If you need layout or spacing:

1. **Use an existing component** that already provides the structure (e.g. `Stack`, `Container`, `SectionWithHeading`, `Card`, `ContentPageLayout`).
2. **Add a reusable component** if the pattern is repeated or will be—put the structure and styles in that component and use it from the page.

In **shared UI / layout components** (e.g. `BucketDetailContent`), do **not** use raw `<div>`, `<h1>`, `<h2>`, or other heading tags when a layout component exists: use **PageHeader** for page/section titles, **SectionWithHeading** for section blocks, **Stack** / **Container** for layout. This keeps markup consistent and lets the design system own structure and semantics.

## How to fix

- **Spacing between blocks:** Prefer layout components (e.g. `Stack` with gap) or margin/padding on the real semantic parent (section, article, the component that owns the content).
- **“Wrapper for one style”:** Move the style onto an existing wrapper or the nearest semantic element; or introduce a small layout component (e.g. in `@boilerplate/ui`) that encodes the pattern.
- **Repeated pattern:** Extract to a shared component with its own module SCSS instead of a one-off div + class.

## Examples

- **Bad:** `<div style={{ marginBottom: '1rem' }}><ButtonLink>...</ButtonLink></div>`  
  **Good:** Use `Stack` with gap, or a layout component that already provides that spacing.

- **Bad:** A `<div className={styles.section}>` that only adds padding and is used once on one page.  
  **Good:** Use `Container`, `Card`, or a layout component; or add a named component (e.g. `Section`) if the pattern is reused.

- **Bad:** Nested divs that each apply one CSS property.  
  **Good:** Single semantic container or existing layout component; consolidate styles there or in a new reusable component.

- **Bad:** `<h2>{name}</h2>` or a raw `<div className={styles.wrap}>` for content width in a shared component.  
  **Good:** `<PageHeader title={name} />` for the title; `<Container contentMaxWidth="readable">` or `<Stack maxWidth="readable">` for layout.

## Relation to other skills

- Prefer **reusable components** (see reusable-components skill) when the pattern is or could be repeated.
- Use **existing UI/layout components** from the design system (Stack, Container, Card, etc.) before introducing new wrapper elements.
