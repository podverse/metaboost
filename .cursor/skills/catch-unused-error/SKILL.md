---
name: catch-unused-error
description: Use parameterless catch when the error value is not used. Use when writing or editing try/catch in TypeScript/JavaScript.
---

# Catch without unused variable

When a `catch` block does **not** use the error value, do not bind it. Use a parameterless `catch` so ESLint `@typescript-eslint/no-unused-vars` is satisfied and the intent is clear.

## Do

```ts
try {
  await sendVerificationEmail(...);
} catch {
  // Continue; best-effort
}
```

## Don't

```ts
try {
  await sendVerificationEmail(...);
} catch (e) {
  // e is never used → no-unused-vars
}
```

## Empty catch and `no-empty`

This repo enables ESLint **`no-empty`** via `eslint.configs.recommended`. A `catch { }` block with **no statements and no comment** is rejected as an empty block. If you swallow the error intentionally, include at least **one comment** (see “Do” above) or a statement. See [no-empty](https://eslint.org/docs/latest/rules/no-empty).

When you **do** need the error (e.g. to log, rethrow, or inspect it), keep the binding: `catch (err) { ... }`. Only omit the parameter when the catch body does not reference the error at all.
