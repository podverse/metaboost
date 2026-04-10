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

When you **do** need the error (e.g. to log, rethrow, or inspect it), keep the binding: `catch (err) { ... }`. Only omit the parameter when the catch body does not reference the error at all.
