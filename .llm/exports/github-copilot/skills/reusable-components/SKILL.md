---
name: reusable-components
description: Prefer reusable components and keep globals minimal. Use when adding layout, form, or UI that could be reused, or when adding styles to globals.scss.
version: 1.0.0
---


# Reusable Components

**When to use:** Any time you are adding layout, form, or UI that could be reused, or when you are about to add styles to `globals.scss` (or app-level global CSS).

## Principles

1. **Prefer reusable components** over one-off markup and global class names. If the same structure or pattern appears on more than one page (or might in the future), extract it into a component.
2. **Keep globals to a minimum.** Use `globals.scss` only for true app-wide basics (e.g. `html`/`body`, root layout wrappers like `.app-view`). Page- or feature-specific layout and styling belong in component module SCSS or layout components.
3. **Colocate styles with components.** Use CSS modules (e.g. `ComponentName.module.scss`) for component-specific styles so they are scoped and easy to find.

## Examples

- **Auth form layout:** Use a shared `AuthFormLayout` (or similar) component with its own `.module.scss` instead of auth-specific classes in `globals.scss`.
- **Repeated page structure:** If multiple pages share a wrapper (e.g. centered card, same padding), create a layout component that accepts `children` and owns the structure and styles.

## Checklist

- Am I adding a class to `globals.scss`? → Consider a reusable component + module SCSS instead.
- Does this layout/structure appear (or could it appear) on more than one route? → Extract to a component.
