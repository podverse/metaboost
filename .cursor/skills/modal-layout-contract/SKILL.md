---
name: modal-layout-contract
description: Modal overflow, ModalDialogContent actions row, right-aligned wrapping footers (web + management-web).
version: 1.0.0
---

# Modal layout contract (`@metaboost/ui`)

**When to use:** Adding or changing dialogs (`Modal`), modal footers, or debugging horizontal scrollbars
inside modals in **apps/web**, **apps/management-web**, or **`packages/ui`** shells (`ConfirmDeleteModal`,
`RateLimitModal`, `GoToPageModal`).

## Layout rules

- **`Modal`** — full-window overlay; use **`withBackdrop`** / **`backdropOpaque`** for confirm dialogs.
  Pass **`onClose`** when the dialog is dismissible (shows close control).
- **`ModalDialogContent`** — standard body wrapper for confirm/prompt dialogs and small forms inside
  **`Modal`**: readable max width, padding that clears the close button, optional **`actions`** slot.
- **`ModalDialogContent` `actions`** — **the** standard footer for cancel/submit (and similar): **`justify-content: flex-end`**, **`flex-wrap: wrap`**, gap from tokens. Use in **both** web and management-web so confirm dialogs match the web baseline (right-aligned group).
- **Do not** add ad hoc **`display: flex; justify-content: flex-end`** rows for modal footers when
  **`ModalDialogContent`** can own the **`actions`** prop — use **`ConfirmDeleteModal`** or compose
  **`ModalDialogContent`** directly.
- **Do not** add **`overflow-x: hidden`** on the modal to mask overflow — fix the child (`min-width: 0`
  on flex/grid items, **`actions`** wrap, break long unbreakable strings).
- **`ModalDialogContent`** root uses **`min-width: 0`**, **`max-width`**, and **`overflow-wrap: anywhere`**
  so content cannot widen the panel; shared form components should still declare **`min-width: 0`** on
  their own flex rows/columns where needed.
- **DOM order:** secondary (**Cancel**) before primary (**Submit** / **Confirm** / **Delete**) inside
  **`actions`** (same as **`FormActions`** / **use-form-component**).
- **Non-modal forms:** use **`FormActions`** from **`@metaboost/ui`** for page footers — same
  right-aligned, wrap, cancel-then-submit order.

## Symptoms

- Horizontal scrollbar on the modal panel or the page when the modal is open → often missing
  **`flex-wrap`** on **`actions`**, or a child with fixed width / **`min-width: auto`** in a flex context;
  check nested flex rows without **`min-width: 0`**.

## Related

- **css-custom-properties-no-var-fallbacks** — no `var(..., fallback)` in modal SCSS
- **reusable-components** — prefer **`Modal`** / **`ModalDialogContent`** over app-local dialog shells
