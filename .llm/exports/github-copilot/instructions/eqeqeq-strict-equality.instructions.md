---
description: "Use strict equality (=== and !==) to satisfy eslint eqeqeq"
applyTo:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---

# Strict Equality (eqeqeq)

Use **strict equality** only. ESLint rule `eqeqeq` expects `===` and `!==`, not `==` or `!=`.

- Do: `x === null`, `x !== undefined`, `x !== null && x !== undefined`
- Don't: `x == null`, `x != null`, or `a == b` / `a != b` in general.
