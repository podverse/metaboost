---
name: use-form-component
description: Never use raw `<form>` in app code. Use Form or FormContainer from @metaboost/ui.
version: 1.0.0
---

# Use Form / FormContainer Instead of Raw &lt;form&gt;

**When to use:** When adding or editing forms in app code (e.g. `apps/web`, `apps/management-web`).

## Rule

Do **not** use raw `<form>` in app code. Use one of:

- **`Form`** (from `@metaboost/ui`) – when you need a titled card plus the form. Renders a Card + `<form>` + Stack; props include `title`, `onSubmit`, `submitError`, `children`.
- **`FormContainer`** (from `@metaboost/ui`) – when the form is already inside a card or other layout. Renders a `<form>` with optional max-width; props: `onSubmit`, `children`, optional `constrainWidth`, optional `className`.

## Pattern

- Wrap **FormContainer** children in **`Stack`** for consistent vertical spacing (flex column + gap).
- Use **Form** when the whole block is “card + form” (e.g. auth screens); use **FormContainer** when the form lives inside an existing card or page section.
- For spacing around the form, use a layout component (e.g. `Stack` with gap or `Container`) rather than a bare `div`; see **avoid-wrapper-elements**.

## Checklist

- Adding a new form? → Use `Form` or `FormContainer` from `@metaboost/ui`, not `<form>`.
- Using FormContainer? → Put form fields and actions inside a single `<Stack>` as the direct child of FormContainer.
