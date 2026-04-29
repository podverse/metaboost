---
name: button-loading-async
description: Always show a loading spinner in a button when it triggers an async action (submit, save, delete, etc.).
version: 1.1.0
---


# Button loading state for async actions

**When to use:** Whenever you add or change a button that triggers an async request (form submit, save, delete, invite, copy, etc.).

## Rule

Any button that starts an async operation (API call, mutation, clipboard write, etc.) must:

1. **Track in-flight state** – e.g. `const [loading, setLoading] = useState(false);` and set `true` at the start of the request, `false` in `finally` (or on success/error).
2. **Pass it to the Button** – use the `loading` prop on `Button` from `@metaboost/ui`: `<Button ... loading={loading}>`. The Button shows an inline spinner and is disabled while `loading` is true.
3. **Disable the button while loading** – either pass `disabled={loading}` explicitly or rely on Button’s built-in behavior (Button already sets `disabled` when `loading` is true). For secondary actions (e.g. Cancel), pass `disabled={loading}` so they are disabled during the primary action.

## Why

- Users get immediate feedback that the action is in progress (visible spinner).
- Prevents double-submit and accidental repeated clicks.
- Matches expected UX for forms and destructive actions.

## Checklist

- Does this button trigger a fetch, mutation, or other async work? → Add (or reuse) a loading state and pass `loading={...}` to the Button.
- For form submit buttons, the same state used for `disabled={loading}` should be passed as `loading={loading}` so the spinner appears.
- For confirm/delete modals, pass `loading={confirmLoading}` (or equivalent) to the confirm Button so the delete button shows a spinner.
- For copy buttons (e.g. clipboard), use a short-lived loading state so the button shows a spinner while the async copy runs.
