---
name: reusable-components
description: Prefer shared UI components from @metaboost/ui over app-local one-off components or page-specific SCSS wrappers when behavior is generic.
version: 1.0.0
---

# reusable-components

## When to use

- Building or refactoring UI in `apps/web` or `apps/management-web`.
- You see repeated `page.module.scss` patterns for headers, forms, table shells, badges, loading/error text, or action rows.
- You are about to add styles to app-level global CSS — prefer a component + module SCSS instead.

## Core rule

Use `@metaboost/ui` first for generic UI behavior. Add app-local components only when the behavior is truly product-specific.

## Web-first convergence

When **web** (`apps/web`) and **management-web** both have a similar generic control (icon button, menu, table chrome, etc.):

- **Implement one shared primitive** in `@metaboost/ui` instead of maintaining parallel app-local copies.
- When reconciling visual differences, **default to the web app’s existing style baseline** (tokens, spacing, borders) unless accessibility or product requirements dictate otherwise. Express differences via props (`appearance`, `variant`) on the shared component.

## i18n (shared UI)

- **Do not** bake user-visible strings (including `aria-label`, `title`, empty/loading copy) into `packages/ui`. Apps own localization (`next-intl`) and pass strings in via props or `children`.
- When you add or extend a shared component that needs copy, add keys in `apps/web` / `apps/management-web` `i18n/originals/en-US.json` (and keep locales aligned per **i18n** skill and **i18n-locale-language** rule).
- Follow the **shared-ui-i18n** workspace rule for details.

## Prefer this order

1. Reuse existing exports from `@metaboost/ui` (`Button`, `ActionLink`, `CopyToClipboardButton`, `Table`, `Pagination`, form field primitives, `Alert`, `LoadingSpinner`, `StatusBadge`, `IconButton`, `DropdownMenu`, **`Modal`** / **`Modal.Actions`** / **`Modal.Body`** when present, etc.).
2. If missing but generic, add a reusable component in `packages/ui/src/components/**` (or a shared hook in `packages/ui/src/hooks/**`) and export it from `packages/ui/src/index.ts`.
3. Use app-local components only for app shell or domain-specific behavior.

## Promotion rubric

| Question                                            | If yes →                           |
| --------------------------------------------------- | ---------------------------------- |
| Used in two apps or a foreseeable second consumer?  | `packages/ui`                      |
| Only strings or router differ?                      | App wrapper around a ui primitive  |
| Imports `next/*` or app-only config?                | App wrapper                        |
| Duplicates a ui component with a small style tweak? | Extend ui `variant` / `appearance` |

For cross-app extraction steps, use **ui-component-promotion**.

## App-local configured wrappers (same app, 2+ callsites)

When the **same** `@metaboost/ui` usage appears in **two or more** places **within one app** (same props, same `next-intl` keys for `aria-label` / visible copy), extract a thin **client** component under `apps/<app>/src/components/**` that:

- Owns **`useTranslations`** (or other app-only wiring) and fixed conventions.
- **Forwards** the remaining props to the shared primitive.
- Does **not** embed strings in `packages/ui`; the wrapper stays in the app.

Avoid **bare** `export { X } from '@metaboost/ui'` re-exports with no behavior.

## Module SCSS tokens

Use only canonical CSS variables from `packages/ui/src/styles/`; do not add `var(--name, fallback)` — see **css-custom-properties-no-var-fallbacks** rule.

## management-web notes (Metaboost)

- **`FormActions`** from `@metaboost/ui` should keep **Cancel then Submit** in the DOM with a **right-aligned** footer (see **use-form-component**).
- Prefer **`Select`** from `@metaboost/ui` over raw `<select>` + loose `<label>` for tier/status fields.
- Forms should use shared form action patterns; prefer `Table` + `Pagination` for list pages.

## Avoid

- New page-specific SCSS utility classes that duplicate existing `@metaboost/ui` behavior.
- Creating a new component in app code when a `@metaboost/ui` primitive can compose the same UI without repeated identical configuration.

## Cross-references

- **ui-component-promotion** — cross-app extraction workflow
- **modal-layout-contract** — `Modal` / `ModalDialogContent` footer rules
- **styles-source-of-truth** — tokens in `packages/ui/src/styles/`
